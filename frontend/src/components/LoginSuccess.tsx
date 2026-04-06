import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const id = searchParams.get('id');
        const name = searchParams.get('name');
        const email = searchParams.get('email');

        console.log('LoginSuccess Handling Params:', { token: !!token, id, name, email });

        if (token && id && name && email) {
            try {
                // Log the user in
                login({ id, name, email }, token);
                
                // Small delay to ensure state is set before navigating
                const timer = setTimeout(() => {
                    console.log('Navigating to dashboard...');
                    navigate('/dashboard', { replace: true });
                }, 500);

                return () => clearTimeout(timer);
            } catch (err) {
                console.error('Login error:', err);
                navigate('/login');
            }
        } else {
            console.error('Failed to log in with Google: Missing parameters');
            // If we're already on dashboard but seeing this, maybe we're already authenticated?
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Completing login...</p>
        </div>
    );
}
