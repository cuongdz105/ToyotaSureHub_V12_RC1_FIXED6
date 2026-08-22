
function CarInfo({ car }) {
  const ai = car.aiContent || {};

  return (
    <section className="car-info">

      <h2>
        {car.brand} {car.model} {car.version}
      </h2>

     
      <hr />

      <p><b>Năm:</b> {car.year}</p>

      <p><b>Màu:</b> {car.color}</p>

      <p>
        <b>ODO:</b>{" "}
        {(Number(car.odo) * 10000).toLocaleString("vi-VN")} km
      </p>

      <p><b>Giá:</b> {car.price}</p>

      <p><b>Bảo hành:</b> {car.warranty}</p>

      <p><b>Pháp lý:</b> {car.legal}</p>

      <p><b>Trạng thái:</b> {car.status}</p>

      

    </section>
  );
}

export default CarInfo;