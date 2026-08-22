import CustomerStats from "../components/CustomerStats";

function Customers() {
  return (
    <>
      
      <main className="content">
        <div className="page-header">
          <div>
            <h1>👥 Quản lý khách hàng</h1>
            <p>Danh sách khách hàng Toyota Sure</p>
          </div>
          
          <button className="btn-add">
            + Thêm khách
          </button>
        </div>

       <CustomerStats />
       
        <div className="card">
          <h3>Chưa có khách hàng nào</h3>
          <p>Hãy thêm khách hàng đầu tiên.</p>
        </div>
      </main>
    </>
  );
}

export default Customers;