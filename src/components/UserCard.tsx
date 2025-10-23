import React from 'react';
import { useSelector } from 'react-redux';


interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {

  const projects = useSelector(state => state.projects);
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">{user?.name}</h3>
      <p className="text-gray-600">{user?.email}</p>
    </div>
  );
};

export default UserCard;