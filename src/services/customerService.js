import { supabase } from "../lib/supabase";
import { getStoreState, setStoreData, insertStoreItem, patchStoreItem, removeStoreItem } from "./appDataStore";

const customerService = {
  getAll() { return getStoreState().customers; },
  saveAll(customers) {
    setStoreData("customers", customers);
    return Promise.all(customers.map((customer) => supabase.from("customers").upsert({ id: customer.id, name: customer.name || "", phone: customer.phone || "", zalo: customer.zalo || "", source: customer.source || "", status: customer.status || "new", notes: customer.notes || "", metadata: customer.metadata || {} })));
  },
  add(customer) {
    const item = { id: customer.id || crypto.randomUUID(), ...customer };
    insertStoreItem("customers", item);
    return supabase.from("customers").insert({ name: item.name || "", phone: item.phone || "", zalo: item.zalo || "", source: item.source || "", status: item.status || "new", notes: item.notes || "", metadata: item.metadata || {} }).select("*").single().then(({ data, error }) => { if (error) throw error; patchStoreItem("customers", item.id, () => ({ ...item, id: data.id })); return data; });
  },
  update(updatedCustomer) {
    patchStoreItem("customers", updatedCustomer.id, () => updatedCustomer);
    return supabase.from("customers").update({ name: updatedCustomer.name || "", phone: updatedCustomer.phone || "", zalo: updatedCustomer.zalo || "", source: updatedCustomer.source || "", status: updatedCustomer.status || "new", notes: updatedCustomer.notes || "", metadata: updatedCustomer.metadata || {} }).eq("id", updatedCustomer.id).then(({ error }) => { if (error) throw error; });
  },
  delete(id) {
    removeStoreItem("customers", id);
    return supabase.from("customers").delete().eq("id", id).then(({ error }) => { if (error) throw error; });
  },
};

export default customerService;
