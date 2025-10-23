import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const { user } = useSelector((state) => state.auth); // أو state.auth لو عندك slice كده
    // لو مفيش يوزر → redirect login
    if (!user) {
        return <Navigate to="/log_in" replace />;
    }

    // لو محدد أدوار واليوزر مش منهم → redirect home
    // if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
    // }

    // لو تمام → يعرض الصفحة المطلوبة
    return (<>
        {children}
    </>)
};

export default ProtectedRoute;
