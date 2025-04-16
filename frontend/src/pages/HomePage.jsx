import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/polls`);
        console.log(res.data);
        setPolls(res.data);
      } catch (err) {
        setError("Failed to fetch polls");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Live Polling Portal</h1>

        {polls.length === 0 ? (
          <div className="text-center text-gray-500">
            No polls available yet. Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll) => (
              <div
                key={poll._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/vote/${poll._id}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">
                      {poll.title || `Poll ${polls.indexOf(poll) + 1}`}
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {poll.questions.length} question{poll.questions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {poll.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{poll.description}</p>
                  )}
                  <p className="text-gray-500 text-sm mb-4">
                    Created: {new Date(poll.createdAt).toLocaleDateString()}
                  </p>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    Start Voting
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
