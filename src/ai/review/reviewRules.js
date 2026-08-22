export const reviewRules = [

{
    id:"no-toyota-sure-my-dinh",
    message:"Không được dùng Toyota Sure Mỹ Đình.",
    test:(text)=>!text.includes("Toyota Sure Mỹ Đình")
},

{
    id:"no-co-the-noi-rang",
    message:"Không dùng 'Có thể nói rằng'.",
    test:(text)=>!text.includes("Có thể nói rằng")
},

{
    id:"no-diem-noi-bat",
    message:"Không dùng 'Điểm nổi bật'.",
    test:(text)=>!text.includes("Điểm nổi bật")
},

{
    id:"phone-required",
    message:"Thiếu số điện thoại.",
    test:(text)=>text.includes("0933666980")
}

];