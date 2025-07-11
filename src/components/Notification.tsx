import React from "react";
import "./Notification.css";

interface Props {
  type: "success" | "error";
  message: string;
}

const Notification: React.FC<Props> = ({ type, message }) => {
  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
};

export default Notification;
