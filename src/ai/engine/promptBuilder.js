import { buildCarName } from "../../utils/format";
import { buildDNA } from "../dna/dnaBuilder";
import { buildMemoryPrompt } from "../memory/memoryBuilder";
import { loadKnowledge } from "../knowledgeLoader";

export function buildPrompt(
  car,
  template,
  researchContext = ""
) {
  const dna = buildDNA("facebook");
  const memory = buildMemoryPrompt();
  const knowledge = loadKnowledge(
    car,
    "facebook"
  );

  const researchBlock =
    researchContext
      ? `
==================================================
DỮ LIỆU NGHIÊN CỨU / BÀI MẪU THAM KHẢO
==================================================

${researchContext}

QUY TẮC SỬ DỤNG DỮ LIỆU NGHIÊN CỨU:

- Chỉ học cách triển khai, hook, cấu trúc,
  nhịp nội dung, góc kể chuyện và cách tạo
  sự chú ý.
- Không sao chép câu chữ nguyên bản.
- Không bê nguyên tiêu đề, câu mở đầu hoặc
  cách diễn đạt của mẫu.
- Ưu tiên mẫu có điểm nghiên cứu cao nhưng
  phải xét độ phù hợp với chiếc xe đang viết.
- Nếu các mẫu mâu thuẫn nhau, ưu tiên mẫu
  phù hợp với nền tảng và chiếc xe hiện tại.
`
      : "";

  return `
${dna}

==================================================
KIẾN THỨC BỔ SUNG
==================================================

${knowledge}

${memory}

${researchBlock}

==================================================
THÔNG TIN XE
==================================================

Tên xe:
${buildCarName(car)}

Năm:
${car.year}

Màu:
${car.color}

ODO:
${car.odo}

Giá:
${car.price} triệu

Bảo hành:
${car.warranty}

Pháp lý:
${car.legal}

Ghi chú:
${car.notes || "Không có"}

==================================================
YÊU CẦU CUỐI
==================================================

Viết như một người bán xe thật.

Đừng giống AI.

Đừng giống quảng cáo.

Đừng cố viết hay.

Nếu bài dài, hãy tự rút ngắn.

Nếu câu quá hoàn chỉnh, hãy viết tự nhiên hơn.

Nếu có thể kể chuyện thay vì liệt kê, hãy kể.

Nếu có dữ liệu nghiên cứu ở trên:
hãy học tư duy triển khai của các mẫu tốt,
nhưng phải tạo nội dung mới cho chiếc xe này.

Mục tiêu là khiến người xem muốn tiếp tục
xem / đọc và cuối cùng muốn nhắn tin.

==================================================
NHIỆM VỤ
==================================================

${template}

==================================================
QUY TẮC TRẢ KẾT QUẢ
==================================================

- Chỉ trả về đúng nội dung.
- Không giải thích.
- Không dùng markdown.
- Không nói bạn là AI.
`;
}