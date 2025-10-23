import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUsers } from "../slices/usersSlice";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list } = useSelector((state) => state.users);

    const [formData, setFormData] = useState({ email: "", name: "" });
    const [error, setError] = useState("");

    React.useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const user = list.find(
            (u) =>
                u.email === formData.email.trim() &&
                u.name.toLowerCase() === formData.name.toLowerCase()
        );

        if (!user) {
            setError("User not found or invalid credentials");
            return;
        }

        // حفظ في localStorage
        localStorage.setItem("user", JSON.stringify(user));

        // تحديث في Redux
        dispatch({ type: "users/setUser", payload: user });

        navigate("/dashboard");
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white shadow-lg rounded-2xl p-8 w-96 space-y-5"
            >
                <h2 className="text-2xl font-semibold text-center text-blue-600">
                    Login
                </h2>

                {error && (
                    <p className="text-red-500 bg-red-50 border border-red-200 rounded p-2 text-sm">
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition"
                >
                    Login
                </button>

                <p className="text-sm text-gray-500 text-center">
                    Don't have an account?{" "}
                    <a href="/register" className="text-blue-600 font-semibold">
                        Register
                    </a>
                </p>
            </form>
        </div>
    );
}

export default Login;
