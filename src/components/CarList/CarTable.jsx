import CarRowActions from "./CarRowActions";

import {
  formatPrice,
  formatOdo,
} from "../../utils/format";

function CarTable({
  cars,
  navigate,
  onDelete,
  onMarkAsSold,
}) {
  return (
    <table className="car-table">
      <thead>
        <tr>
          <th>Tên xe</th>
          <th>Năm</th>
          <th>Màu</th>
          <th>Giá</th>
          <th>ODO</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>

      <tbody>
        {cars.map((car) => (
          <tr key={car.id}>
            <td>
              {car.brand} {car.model} {car.version}
            </td>

            <td>{car.year}</td>

            <td>{car.color}</td>

            <td>
              {formatPrice(car.price)}
            </td>

            <td>
              {formatOdo(car.odo)}
            </td>

            <td>
              {car.status}
            </td>

            <td>
              <CarRowActions
                car={car}
                navigate={navigate}
                onDelete={onDelete}
                onMarkAsSold={onMarkAsSold}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CarTable;