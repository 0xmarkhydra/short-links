import Link from "next/link"; import {Logo} from "@/components/Logo";
export default function NotFound(){return <div className="status-page"><Logo/><div><strong>404</strong><h1>Không tìm thấy trang</h1><p>Liên kết có thể không tồn tại hoặc đã bị xóa.</p><Link className="btn btn-primary" href="/">Về trang chủ</Link></div></div>}
