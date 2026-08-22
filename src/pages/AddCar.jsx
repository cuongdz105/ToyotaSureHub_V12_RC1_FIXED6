import CarForm from "../components/CarForm";

function AddCar() {
  return (
    <div className="app">
     
      <main className="content">
        <h1>➕ Thêm xe mới</h1>

        <CarForm />
      </main>
    </div>
  );
}

export default AddCar;