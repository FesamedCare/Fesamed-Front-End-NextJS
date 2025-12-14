import { Suspense } from "react";
import Form from "../ui/login/login-form";
import Footer from "../ui/navigation/footer";

export default function Login() {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <Form />
            </Suspense>
            <Footer />
        </div>
    );
}