import { useParams } from "react-router-dom";

import CarForm from "../components/CarForm";
import { getCarById } from "../services/carService";

function EditCar() {
  const { id } = useParams();

  const car = getCarById(id);

  return (
    <div className="app">
      
      <main className="content">
        <h1>✏️ Sửa thông tin xe</h1>

        <CarForm editCar={car} />
      </main>
    </div>
  );
}

export default EditCar;