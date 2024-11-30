import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextInput } from "../TextInput";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(`/reset-password/${token}`, {
        password,
      });
      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to reset password");
    }
  }

  return (
    <div className="mt-4 grow flex items-center justify-around">
      <div className="mb-64 w-full max-w-md mx-auto">
        <h1 className="text-4xl text-center mb-4">Reset Password</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && (
          <p className="text-green-500 text-center mb-4">{message}</p>
        )}

        <form onSubmit={handleSubmit}>
          <TextInput
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
          />
          <TextInput
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            required
          />
          <button className="primary w-full">Reset Password</button>
        </form>
      </div>
    </div>
  );
}
