import axios from "axios";

export default axios.create({
  baseURL: "https://hyperlife-backend.onrender.com/api",
  withCredentials: true,
});



