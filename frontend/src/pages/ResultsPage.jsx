import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import ChartComponent from "../components/ChartComponent";

const apiUrl = import.meta.env.VITE_API_URL;
const socket = io(apiUrl, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

const ResultsPage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/polls/${pollId}`);
        setPoll(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPoll();

    socket.emit("joinPoll", pollId);
    socket.on("pollUpdate", (updatedPoll) => {
      if (updatedPoll._id === pollId) {
        setPoll(updatedPoll);
      }
    });

    return () => {
      socket.off("pollUpdate");
    };
  }, [pollId]);

  if (!poll)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  const totalVotes = (questionIndex) => {
    return poll.questions[questionIndex].options.reduce((sum, option) => sum + option.votes, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{poll.title}</h1>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Home
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Question {activeQuestion + 1} of {poll.questions.length}
            </h2>
            <p className="text-lg text-gray-700 mb-6">{poll.questions[activeQuestion].text}</p>

            <div className="bg-gray-50 p-6 rounded-lg">
              <ChartComponent
                labels={poll.questions[activeQuestion].options.map((opt) => opt.text)}
                data={poll.questions[activeQuestion].options.map((opt) => opt.votes)}
                totalVotes={totalVotes(activeQuestion)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {poll.questions[activeQuestion].options.map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-800">{option.text}</span>
                    <span className="text-gray-600">
                      {option.votes} vote{option.votes !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width:
                          totalVotes(activeQuestion) > 0
                            ? `${(option.votes / totalVotes(activeQuestion)) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                  <div className="text-right mt-1 text-sm text-gray-500">
                    {totalVotes(activeQuestion) > 0
                      ? `${Math.round((option.votes / totalVotes(activeQuestion)) * 100)}%`
                      : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setActiveQuestion(Math.max(0, activeQuestion - 1))}
              disabled={activeQuestion === 0}
              className={`px-4 py-2 rounded-md ${
                activeQuestion === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {poll.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveQuestion(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeQuestion === index
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setActiveQuestion(Math.min(poll.questions.length - 1, activeQuestion + 1))
              }
              disabled={activeQuestion === poll.questions.length - 1}
              className={`px-4 py-2 rounded-md ${
                activeQuestion === poll.questions.length - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
