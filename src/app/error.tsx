"use client";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="status-page"><div><strong>500</strong><h1>Đã có lỗi xảy ra</h1><p>Vui lòng thử lại. Nếu lỗi tiếp tục xuất hiện, hãy kiểm tra kết nối database và log server.</p><button className="btn btn-primary" onClick={reset}>Thử lại</button></div></div>}
