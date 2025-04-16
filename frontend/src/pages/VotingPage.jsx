import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL;
const socket = io(apiUrl);

const VotingPage = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/polls/${pollId}`);
        setPoll(res.data);

        // Check if user has already voted
        const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
        if (votedPolls[pollId]) {
          setHasVoted(true);
        }
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

  const handleOptionChange = (questionIndex, optionIndex) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionIndex]: optionIndex,
    });
  };

  const handleVote = async () => {
    if (!poll || Object.keys(selectedOptions).length !== poll.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const votes = Object.entries(selectedOptions).map(([qIndex, oIndex]) => ({
        questionIndex: parseInt(qIndex),
        optionIndex: parseInt(oIndex),
      }));

      await axios.post(`${apiUrl}/api/polls/${pollId}/vote`, { votes });

      // Mark as voted in localStorage
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      votedPolls[pollId] = true;
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

      setHasVoted(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!poll)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your vote has been successfully recorded.</p>
          <button
            onClick={() => navigate(`/results/${pollId}`)}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            View Live Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{poll.title}</h1>
          <div className="space-y-8">
            {poll.questions.map((question, qIndex) => (
              <div key={qIndex} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {qIndex + 1}. {question.text}
                </h3>

                <div className="space-y-3">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${qIndex}-o${oIndex}`}
                        name={`question-${qIndex}`}
                        checked={selectedOptions[qIndex] === oIndex}
                        onChange={() => handleOptionChange(qIndex, oIndex)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={`q${qIndex}-o${oIndex}`} className="ml-3 block text-gray-700">
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleVote}
              disabled={
                isSubmitting || Object.keys(selectedOptions).length !== poll.questions.length
              }
              className={`px-6 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSubmitting || Object.keys(selectedOptions).length !== poll.questions.length
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Vote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
