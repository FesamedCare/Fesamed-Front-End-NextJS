import { Suspense } from "react";
import Form from "../ui/login/login-form";
import { AuthPageShell } from "../ui/auth/auth-page-shell";
import Footer from "../ui/navigation/footer";

export default function Login() {
    return (
        <div>
            <AuthPageShell>
                <Suspense fallback={<div>Loading...</div>}>
                    <Form />
                </Suspense>
            </AuthPageShell>
            <Footer />
        </div>
    );
}