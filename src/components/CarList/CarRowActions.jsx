import Button from "../UI/Button";
import { startPosting } from "../../services/postingSessionService";

function CarRowActions({
  car,
  navigate,
  onDelete,
  onMarkAsSold,
}) {

  const handleFacebook = () => {
    startPosting(car);
    navigate("/facebook/post", { state: { carId: car.id } });
  };

  const handleMarkAsSold = () => {
    if (
      typeof onMarkAsSold ===
      "function"
    ) {
      onMarkAsSold(car);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          navigate(
            `/cars/${car.id}`
          )
        }
      >
        👁️
      </Button>

      <Button
        onClick={() =>
          navigate(
            `/edit/${car.id}`
          )
        }
      >
        ✏️
      </Button>

      <Button
        onClick={handleFacebook}
      >
        📣
      </Button>

      {/* =====================================
          ĐÁNH DẤU XE ĐÃ BÁN
      ===================================== */}

      {car.status !==
        "🔴 Đã bán" && (
        <Button
          onClick={
            handleMarkAsSold
          }
        >
          🔴 Đã bán
        </Button>
      )}

      <Button
        variant="danger"
        onClick={() =>
          onDelete(car.id)
        }
      >
        🗑️
      </Button>
    </>
  );
}

export default CarRowActions;