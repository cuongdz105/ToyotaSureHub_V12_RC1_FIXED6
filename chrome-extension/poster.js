// ==========================================================
// SCRIPT ĐĂNG BÀI — chạy BÊN TRONG tab Facebook
// ==========================================================
// Hàm này được chrome.scripting.executeScript "bơm" vào trang
// trang cá nhân Facebook, nên PHẢI tự chứa mọi thứ (không dùng
// biến/hàm bên ngoài).
//
// Dùng chung cho TƯỜNG CÁ NHÂN và NHÓM. Các bước:
//   1. Kiểm tra đã đăng nhập / không bị checkpoint
//   2. Bấm ô "Bạn đang nghĩ gì?" (tường) / "Viết nội dung..." (nhóm)
//   3. Dán nội dung vào khung soạn bài
//   4. Gắn ảnh (dán ảnh, nếu không được thì dùng nút Ảnh/video)
//   5. Bấm "Tiếp" → (nếu có opts.share) "Chia sẻ lên nhóm":
//      KHÔNG gõ tìm kiếm (máy tính chỉ trả 10 kết quả), mà cuộn hết
//      danh sách rồi tick các nhóm có từ khoá trong tên, từ trên xuống
//   6. Bấm "Đăng", chờ khung soạn bài đóng = đăng thành công
//
// Facebook đổi giao diện thì thường chỉ cần sửa các mẫu chữ
// trong TEXT bên dưới.
// ==========================================================

export async function postToFacebook(job, images, opts) {
  const TEXT = {
    composer: /^(bạn đang nghĩ gì|what'?s on your mind|viết nội dung|write something|bạn viết gì đi|tạo bài viết công khai|create a public post)/i,
    shareGroups: /^(chia sẻ (lên|vào|với) (nhiều |các |thêm )?nhóm|đăng (lên|vào|trong) (nhiều |các |thêm )?nhóm|thêm nhóm|chọn nhóm|nhóm khác|share (to|in) (more |other )?groups?|post (to|in) (more |other )?groups?|add groups?|more groups)/i,
    groupsDone: /^(xong|done|lưu|save|áp dụng|apply|chọn|select|ok)$/i,
    shareLimit: /(đạt đến giới hạn|reached the limit|giới hạn chia sẻ|sharing limit)/i,
    joinGroup: /^(tham gia nhóm|join group)$/i,
    photo: /^(ảnh\/video|photo\/video|ảnh|photo)$/i,
    post: /^(đăng|post)$/i,
    next: /^(tiếp|next)$/i,
    blocked: /(tạm thời bị chặn|temporarily blocked|bạn không thể đăng|you can'?t post|chặn tính năng|feature blocked|hành vi đáng ngờ|suspicious activity)/i,
    error: /(đã xảy ra lỗi|something went wrong|không thể đăng bài|couldn'?t post|thử lại sau|try again later)/i,
  };

  const steps = [];
  const step = (message) => steps.push(`${new Date().toLocaleTimeString("vi-VN")} ${message}`);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (min, max) => Math.round(min + Math.random() * (max - min));
  const human = (min = 600, max = 1600) => sleep(rand(min, max));

  // Giữ cho service worker của tiện ích không bị Chrome tắt giữa chừng
  const heartbeat = setInterval(() => {
    try { chrome.runtime.sendMessage({ type: "tsh-heartbeat" }); } catch { /* bỏ qua */ }
  }, 10000);

  let sharedGroups = [];

  const done = (ok, code, reason) => {
    clearInterval(heartbeat);
    step(ok ? "✅ Hoàn tất" : `❌ ${reason}`);
    return { ok, code, reason: reason || "", steps, url: location.href, sharedGroups };
  };

  // Bỏ dấu tiếng Việt, chữ thường, gom khoảng trắng → để so tên nhóm
  const norm = (text) =>
    String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
  };

  const labelOf = (el) => (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();

  async function waitFor(fn, timeout, interval = 500) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try {
        const value = fn();
        if (value) return value;
      } catch { /* thử lại */ }
      await sleep(interval);
    }
    return null;
  }

  function findBlockMessage() {
    const nodes = document.querySelectorAll('[role="dialog"], [role="alert"], [role="alertdialog"]');
    for (const node of nodes) {
      const text = (node.innerText || "").slice(0, 2000);
      if (TEXT.blocked.test(text)) return { code: "blocked", text };
    }
    return null;
  }

  function findComposerTrigger() {
    const candidates = document.querySelectorAll('[role="button"], [role="textbox"]');
    for (const el of candidates) {
      if (el.closest('[role="dialog"]')) continue;
      if (!isVisible(el)) continue;
      if (TEXT.composer.test(labelOf(el))) return el;
    }
    return null;
  }

  function findEditor() {
    const editors = document.querySelectorAll('[role="dialog"] [contenteditable="true"][role="textbox"]');
    for (const el of editors) if (isVisible(el)) return el;
    return null;
  }

  function findButtonIn(root, pattern) {
    const buttons = root.querySelectorAll('[role="button"], button');
    for (const el of buttons) {
      if (!isVisible(el)) continue;
      const aria = (el.getAttribute("aria-label") || "").trim();
      const text = (el.innerText || "").trim();
      if (pattern.test(aria) || pattern.test(text)) return el;
    }
    return null;
  }

  const isDisabled = (el) => el.getAttribute("aria-disabled") === "true" || el.disabled === true;

  function mediaCount(dialog) {
    return [...dialog.querySelectorAll("img, video")].filter((el) => {
      const rect = el.getBoundingClientRect();
      // Bỏ qua avatar, emoji, icon nhỏ
      return rect.width >= 60 && rect.height >= 60;
    }).length;
  }

  function base64ToFile(item, index) {
    const binary = atob(item.b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const type = item.type || "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    return new File([bytes], item.name || `anh-${index + 1}.${ext}`, { type, lastModified: Date.now() });
  }

  // Cửa sổ mở ngầm bị Windows che → Chrome cho trang "ngủ", Facebook
  // xử lý ảnh bị treo. Khi đó nhờ tiện ích đưa cửa sổ lên trước.
  async function ensureVisible(reason) {
    if (!document.hidden) return;
    step(`Trang đang bị ẩn → đưa cửa sổ lên trước (${reason})`);
    try { chrome.runtime.sendMessage({ type: "tsh-need-focus" }); } catch { /* bỏ qua */ }
    await waitFor(() => !document.hidden, 8000, 300);
    await sleep(800);
  }

  function pasteInto(target, dataTransfer) {
    target.focus();
    const event = new ClipboardEvent("paste", { clipboardData: dataTransfer, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
  }

  // ======================================================
  // CHIA SẺ LÊN NHÓM
  // ======================================================
  // share = { keywords: ["camry","toyota"], max: 10,
  //           skip: { "<tên đã chuẩn hóa>": số lần đã chia sẻ hôm nay },
  //           exclude: ["<tên nhóm chính>"] }
  // Nhóm trùng tên vẫn là nhóm khác nhau → bỏ qua N lần xuất hiện
  // đầu tiên của 1 tên nếu hôm nay đã chia sẻ tên đó N lần.
  async function shareToGroups(share) {
    const opener = await waitFor(() => {
      for (const scope of document.querySelectorAll('[role="dialog"]')) {
        const btn = findButtonIn(scope, TEXT.shareGroups);
        if (btn) return btn;
        const any = [...scope.querySelectorAll("div, span")].find(
          (el) => isVisible(el) && TEXT.shareGroups.test((el.innerText || "").trim()) && el.children.length < 6
        );
        if (any) return any.closest('[role="button"]') || any;
      }
      return null;
    }, 15000);
    if (!opener) {
      // Ghi lại các nút đang thấy trong khung soạn bài để biết Facebook đặt tên gì
      const seen = [];
      for (const scope of document.querySelectorAll('[role="dialog"]')) {
        for (const el of scope.querySelectorAll('[role="button"], [role="switch"], [role="checkbox"], [role="link"], button')) {
          if (!isVisible(el)) continue;
          const t = labelOf(el).slice(0, 40);
          if (t && !seen.includes(t)) seen.push(t);
        }
      }
      step("⚠️ Không thấy mục \"Chia sẻ lên nhóm\" — chỉ đăng nhóm chính. Các nút đang thấy: " + seen.slice(0, 40).join(" | "));
      return [];
    }
    opener.click();
    step("Mở \"Chia sẻ lên nhóm\"");
    await human(1500, 2500);

    const checkboxesIn = (root) =>
      [...root.querySelectorAll('[role="checkbox"], input[type="checkbox"]')].filter((el) => el.isConnected);

    // Khung "Thêm nhóm" = dialog có nhiều ô tick nhất
    const findPicker = () => {
      let best = null;
      for (const scope of document.querySelectorAll('[role="dialog"]')) {
        const count = checkboxesIn(scope).length;
        if (count > 0 && (!best || count > best.count)) best = { scope, count };
      }
      return best?.scope || null;
    };
    const picker = await waitFor(findPicker, 15000);
    if (!picker) {
      step("⚠️ Danh sách nhóm không hiện ra — chỉ đăng nhóm chính");
      return [];
    }

    // Cuộn hết danh sách (không gõ tìm kiếm): Facebook chỉ tải thêm nhóm khi
    // cuộn xuống, nên kéo ô tick CUỐI CÙNG vào tầm nhìn, lặp tới khi hết nhóm mới.
    {
      let last = checkboxesIn(picker).length;
      let still = 0;
      for (let i = 0; i < 80 && still < 4; i += 1) {
        const boxes = checkboxesIn(picker);
        const lastBox = boxes[boxes.length - 1];
        if (lastBox) {
          lastBox.scrollIntoView({ block: "end" });
          // Cuộn thêm khung chứa (nếu tìm được) cho chắc
          let el = lastBox.parentElement;
          while (el && el !== document.body) {
            if (el.scrollHeight > el.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
              el.scrollTop = el.scrollHeight;
              break;
            }
            el = el.parentElement;
          }
        }
        await sleep(rand(1000, 1600));
        const count = checkboxesIn(picker).length;
        still = count === last ? still + 1 : 0;
        last = count;
      }
      checkboxesIn(picker)[0]?.scrollIntoView({ block: "center" });
      await sleep(600);
    }

    const isChecked = (box) =>
      box.getAttribute("aria-checked") === "true" || box.checked === true;

    const rowName = (box) => {
      let el = box;
      for (let i = 0; i < 8 && el && el !== picker; i += 1) {
        el = el.parentElement;
        const text = (el?.innerText || "").trim();
        if (text.length > 3) {
          const lines = text.split("\n").map((t) => t.trim()).filter(Boolean);
          const name = lines.filter((t) => !/^(lần truy cập|last visited|·)/i.test(t) && !/lần truy cập|last visited/i.test(t))[0];
          if (name) return name;
        }
      }
      return "";
    };

    const rows = checkboxesIn(picker).map((box) => ({ box, name: rowName(box) })).filter((r) => r.name);
    step(`Danh sách có ${rows.length} nhóm`);

    const exclude = new Set((share.exclude || []).map(norm));
    const skip = { ...(share.skip || {}) };
    const keywords = (share.keywords || []).map(norm).filter(Boolean);
    const picked = [];
    const used = new Set();

    // Bỏ các cụm "xe khác" khỏi tên nhóm trước khi tìm từ khoá
    // (vd từ khoá "cross" không ăn vào "Innova Cross", "Yaris Cross"...)
    const blockers = share.blockers || {};
    const matchesKw = (key, kw) => {
      let k = " " + key.replace(/[-_]/g, " ").replace(/\s+/g, " ") + " ";
      for (const b of blockers[kw] || []) k = k.split(norm(b)).join(" ");
      return k.includes(kw);
    };

    for (const kw of keywords) {
      const seen = {};
      for (const row of rows) {
        if (picked.length >= share.max) break;
        const key = norm(row.name);
        seen[key] = (seen[key] || 0) + 1;
        if (used.has(row.box) || exclude.has(key)) continue;
        if (!matchesKw(key, kw)) continue;
        if (seen[key] <= (skip[key] || 0)) continue;          // đã chia sẻ hôm nay
        if (isChecked(row.box)) {
          used.add(row.box);
          picked.push(row.name);
          continue;
        }
        row.box.scrollIntoView({ block: "center" });
        await human(300, 700);
        row.box.click();
        // Facebook đôi khi cập nhật dấu tick chậm → chờ tới 3 giây rồi mới kết luận
        await waitFor(() => isChecked(row.box), 3000, 250);
        if (!isChecked(row.box)) {
          const limit = [...document.querySelectorAll('[role="dialog"]')].some((d) => TEXT.shareLimit.test(d.innerText || ""));
          if (limit) {
            step("Facebook báo đã đạt giới hạn số nhóm");
            break;
          }
          continue;
        }
        used.add(row.box);
        picked.push(row.name);
      }
      if (picked.length >= share.max) break;
    }
    step(`Đã tick ${picked.length} nhóm thêm`);

    await human(800, 1500);
    const doneBtn = findButtonIn(picker, TEXT.groupsDone);
    if (doneBtn) {
      doneBtn.click();
      step("Bấm \"Xong\"");
      await human(1500, 2500);
    } else {
      step("⚠️ Không thấy nút \"Xong\" trong danh sách nhóm");
    }
    return picked;
  }

  try {
    step(`Mở ${location.href}`);

    // ---------- 1. Kiểm tra trạng thái tài khoản ----------
    if (/\/checkpoint\//.test(location.pathname)) {
      return done(false, "checkpoint", "Facebook đang checkpoint tài khoản này — ông vào Facebook xử lý tay.");
    }
    if (document.querySelector('input[name="email"]') && document.querySelector('input[name="pass"]')) {
      return done(false, "login", "Chrome này chưa đăng nhập Facebook.");
    }
    const earlyBlock = findBlockMessage();
    if (earlyBlock) return done(false, "blocked", "Facebook báo đang chặn tính năng: " + earlyBlock.text.slice(0, 200));

    // ---------- 2. Mở khung soạn bài ----------
    const trigger = await waitFor(findComposerTrigger, 40000);
    if (!trigger) {
      if (findButtonIn(document, TEXT.joinGroup)) {
        return done(false, "not_member", "Tài khoản chưa tham gia nhóm này.");
      }
      return done(false, "ui", "Không tìm thấy ô soạn bài (\"Bạn đang nghĩ gì?\" / \"Viết nội dung...\").");
    }
    trigger.scrollIntoView({ block: "center" });
    await human(800, 1800);
    trigger.click();
    step("Đã mở ô soạn bài");

    const editor = await waitFor(findEditor, 20000);
    if (!editor) return done(false, "ui", "Khung soạn bài không mở ra.");
    const dialog = editor.closest('[role="dialog"]') || document;
    await human(1000, 2000);

    // ---------- 3. Dán nội dung ----------
    const content = String(job.content || "").trim();
    const textData = new DataTransfer();
    textData.setData("text/plain", content);
    pasteInto(editor, textData);
    await sleep(1200);

    const typedLength = () => (findEditor()?.innerText || "").replace(/\s+/g, "").length;
    const wantLength = content.replace(/\s+/g, "").length;
    if (typedLength() < wantLength * 0.6) {
      step("Dán chưa ăn, thử cách gõ trực tiếp");
      const ed = findEditor();
      ed.focus();
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, content);
      await sleep(1200);
    }
    if (typedLength() < wantLength * 0.6) {
      return done(false, "ui", "Không điền được nội dung vào khung soạn bài.");
    }
    step(`Đã điền nội dung (${content.length} ký tự)`);
    await human(1200, 2500);

    // ---------- 4. Gắn ảnh ----------
    if (Array.isArray(images) && images.length > 0) {
      await ensureVisible("gắn ảnh");
      const files = images.map(base64ToFile);
      const before = mediaCount(dialog);

      const fileData = new DataTransfer();
      files.forEach((file) => fileData.items.add(file));
      pasteInto(findEditor() || editor, fileData);
      step(`Dán ${files.length} ảnh`);

      let attached = await waitFor(() => mediaCount(dialog) > before, 15000);

      if (!attached) {
        step("Dán ảnh chưa ăn, dùng nút Ảnh/video");
        let input = dialog.querySelector('input[type="file"][accept*="image"]');
        if (!input) {
          const photoBtn = findButtonIn(dialog, TEXT.photo);
          if (photoBtn) {
            photoBtn.click();
            await sleep(1500);
          }
          input = await waitFor(() => dialog.querySelector('input[type="file"][accept*="image"]') || document.querySelector('[role="dialog"] input[type="file"][accept*="image"]'), 8000);
        }
        if (!input) return done(false, "ui", "Không tìm được chỗ gắn ảnh trong khung soạn bài.");
        const inputData = new DataTransfer();
        files.forEach((file) => inputData.items.add(file));
        input.files = inputData.files;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        attached = await waitFor(() => mediaCount(dialog) > before, 20000);
      }
      if (!attached) return done(false, "ui", "Ảnh không gắn được vào bài.");

      // Chờ ảnh tải lên xong (thanh tiến trình biến mất)
      await ensureVisible("tải ảnh");
      await sleep(Math.min(2000 * files.length, 25000));
      await waitFor(() => !dialog.querySelector('[role="progressbar"]'), 90000, 1000);
      step(`Đã gắn ảnh (${mediaCount(dialog)} ảnh hiển thị)`);
    }

    await human(1500, 3000);

    // ---------- 5. Bấm Đăng ----------
    // Facebook có 2 kiểu: nút "Đăng" luôn, hoặc "Tiếp" rồi mới tới "Đăng".
    // Tìm cái nào bấm được trước thì dùng cái đó.
    const findEnabled = (pattern) => {
      for (const scope of document.querySelectorAll('[role="dialog"]')) {
        const btn = findButtonIn(scope, pattern);
        if (btn && !isDisabled(btn)) return btn;
      }
      return null;
    };

    let postBtn = null;
    for (let round = 0; round < 3 && !postBtn; round += 1) {
      await ensureVisible("tìm nút Đăng");
      const found = await waitFor(() => {
        const post = findEnabled(TEXT.post);
        if (post) return { kind: "post", el: post };
        const next = findEnabled(TEXT.next);
        if (next) return { kind: "next", el: next };
        return null;
      }, 60000);
      if (!found) break;
      if (found.kind === "post") {
        postBtn = found.el;
      } else {
        found.el.click();
        step("Bấm \"Tiếp\"");
        await human(2000, 3500);
      }
    }
    if (!postBtn) return done(false, "ui", "Nút \"Đăng\" không bấm được (có thể ảnh chưa tải xong).");

    // ---------- 5b. Chia sẻ thêm lên nhóm ----------
    if (opts?.share && Number(opts.share.max) > 0) {
      await ensureVisible("chọn nhóm");
      sharedGroups = await shareToGroups(opts.share);
      postBtn = await waitFor(() => findEnabled(TEXT.post), 20000);
      if (!postBtn) return done(false, "ui", "Chọn nhóm xong nhưng không quay lại được nút \"Đăng\".");
    }

    if (opts?.dryRun) {
      step("CHẠY THỬ: đã điền xong, KHÔNG bấm Đăng");
      return done(true, "dry_run", "");
    }

    postBtn.click();
    step("Đã bấm \"Đăng\"");

    // ---------- 6. Chờ đăng xong ----------
    const finished = await waitFor(() => {
      const block = findBlockMessage();
      if (block) return block;
      const stillOpen = findEditor() || (postBtn.isConnected && isVisible(postBtn));
      return stillOpen ? null : { code: "ok" };
    }, 120000, 1000);

    if (!finished) return done(false, "timeout", "Bấm Đăng rồi nhưng sau 2 phút khung soạn bài vẫn chưa đóng.");
    if (finished.code === "blocked") return done(false, "blocked", "Facebook báo đang chặn tính năng: " + finished.text.slice(0, 200));

    await sleep(2500);
    const lateBlock = findBlockMessage();
    if (lateBlock) return done(false, "blocked", "Facebook báo đang chặn tính năng: " + lateBlock.text.slice(0, 200));
    const errDialog = [...document.querySelectorAll('[role="dialog"], [role="alert"]')].find((node) => TEXT.error.test(node.innerText || ""));
    if (errDialog) return done(false, "fb_error", "Facebook báo lỗi: " + (errDialog.innerText || "").slice(0, 200));

    return done(true, "ok", "");
  } catch (error) {
    return done(false, "script", "Lỗi script: " + (error?.message || String(error)));
  }
}
