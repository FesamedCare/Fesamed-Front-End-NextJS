import { AuthPageShell } from "../ui/auth/auth-page-shell";
import Footer from "../ui/navigation/footer";
import RoleSelection from "../ui/register/select-role";

export default function Register() {
    return (
        <div>
            <AuthPageShell>
                <RoleSelection/>
            </AuthPageShell>
            <Footer />
        </div>
    );
}