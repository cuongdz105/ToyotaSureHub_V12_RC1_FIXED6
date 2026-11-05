// ==========================================================
// SCRIPT ĐĂNG BÀI — chạy BÊN TRONG tab Facebook
// ==========================================================
// Hàm này được chrome.scripting.executeScript "bơm" vào trang
// trang cá nhân Facebook, nên PHẢI tự chứa mọi thứ (không dùng
// biến/hàm bên ngoài).
//
// Các bước:
//   1. Kiểm tra đã đăng nhập / không bị checkpoint
//   2. Bấm ô "Bạn đang nghĩ gì?"
//   3. Dán nội dung vào khung soạn bài
//   4. Gắn ảnh (dán ảnh, nếu không được thì dùng nút Ảnh/video)
//   5. Chờ ảnh tải xong, bấm "Đăng"
//   6. Chờ khung soạn bài đóng = đăng thành công
//
// Facebook đổi giao diện thì thường chỉ cần sửa các mẫu chữ
// trong TEXT bên dưới.
// ==========================================================

export async function postToWall(job, images, opts) {
  const TEXT = {
    composer: /^(bạn đang nghĩ gì|what'?s on your mind|bạn đang nghĩ gì vậy)/i,
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

  const done = (ok, code, reason) => {
    clearInterval(heartbeat);
    step(ok ? "✅ Hoàn tất" : `❌ ${reason}`);
    return { ok, code, reason: reason || "", steps, url: location.href };
  };

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

  function pasteInto(target, dataTransfer) {
    target.focus();
    const event = new ClipboardEvent("paste", { clipboardData: dataTransfer, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
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
    if (!trigger) return done(false, "ui", "Không tìm thấy ô \"Bạn đang nghĩ gì?\" trên trang cá nhân.");
    trigger.scrollIntoView({ block: "center" });
    await human(800, 1800);
    trigger.click();
    step("Đã bấm \"Bạn đang nghĩ gì?\"");

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
      await sleep(Math.min(2000 * files.length, 25000));
      await waitFor(() => !dialog.querySelector('[role="progressbar"]'), 90000, 1000);
      step(`Đã gắn ảnh (${mediaCount(dialog)} ảnh hiển thị)`);
    }

    await human(1500, 3000);

    // ---------- 5. Bấm Đăng ----------
    let postBtn = await waitFor(() => {
      const btn = findButtonIn(dialog, TEXT.post);
      return btn && !isDisabled(btn) ? btn : null;
    }, 60000);

    if (!postBtn) {
      // Giao diện mới: "Tiếp" rồi mới tới "Đăng"
      const nextBtn = findButtonIn(dialog, TEXT.next);
      if (nextBtn && !isDisabled(nextBtn)) {
        nextBtn.click();
        step("Bấm \"Tiếp\"");
        await human(1500, 2500);
        postBtn = await waitFor(() => {
          const scope = document.querySelector('[role="dialog"]') || document;
          const btn = findButtonIn(scope, TEXT.post);
          return btn && !isDisabled(btn) ? btn : null;
        }, 30000);
      }
    }
    if (!postBtn) return done(false, "ui", "Nút \"Đăng\" không bấm được (có thể ảnh chưa tải xong).");

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
      return findEditor() ? null : { code: "ok" };
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
