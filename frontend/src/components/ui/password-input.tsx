"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./icon";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input className={`input ${props.className ?? ""}`.trim()} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
