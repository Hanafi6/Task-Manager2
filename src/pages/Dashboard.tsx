import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut } from 'lucide-react'
import { logoutUser } from '../slices/AuthSlice.js'
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [err, setError] = useState('')
  const users = useSelector((state: any) => state.auth.usersList);
  const { user, logoutLoading } = useSelector((state: any) => state.auth);
  const projects = useSelector((state: any) => state.projects.list);
  const tasks = useSelector((state: any) => state.projects.tasks);
  const navigate = useNavigate();

  const dispatch = useDispatch()

  const handelLogOut = () => {
    dispatch(logoutUser())
      .unwrap()
      .then((res) => {
        navigate("/");
      })
      .catch((err) => {
        console.log("❌ error:", err);
      });
  }

  useEffect(() => {
    // console.log(logoutLoading)
  }, [logoutLoading])
  return (
    <div className="container mx-auto p-4">
      <div className='w-full flex justify-evenly'>
        <div>{user.name.slice(0, 8)}</div>
        <button onClick={() => handelLogOut()}>{!logoutLoading ? <LogOut /> : <div>...Loged Out</div>}</button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <p className="text-3xl font-bold text-blue-600">{users?.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Projects</h2>
          <p className="text-3xl font-bold text-green-600">{projects?.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <p className="text-3xl font-bold text-purple-600">{tasks?.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            Completed: {tasks?.filter((task: any) => task.completed).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;