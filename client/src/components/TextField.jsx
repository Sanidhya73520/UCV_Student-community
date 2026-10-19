import React, { forwardRef } from "react";

export const TextField = forwardRef(function TextField(
  {
    id,
    label,
    error,
    helperText,
    type = "text",
    placeholder,
    required = false,
    disabled = false,
    style = {},
    inputStyle = {},
    rightElement = null,
    ...props
  },
  ref,
) {
  const inputId =
    id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        ...style,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--navy)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            {label} {required && <span style={{ color: "var(--red)" }}>*</span>}
          </span>
          {rightElement}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        autoCapitalize={
          props.autoCapitalize ||
          (type === "email" || type === "password" ? "none" : undefined)
        }
        autoCorrect={
          props.autoCorrect ||
          (type === "email" || type === "password" ? "off" : undefined)
        }
        spellCheck={
          props.spellCheck ??
          (type === "email" || type === "password" ? false : undefined)
        }
        style={{
          minHeight: "44px",
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          border: error
            ? "1.5px solid var(--red)"
            : "1px solid var(--field-border)",
          backgroundColor: disabled ? "var(--paper)" : "var(--white)",
          color: "var(--navy)",
          fontSize: "0.95rem",
          outline: "none",
          transition: "border-color var(--transition-fast)",
          ...inputStyle,
        }}
        {...props}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          style={{
            fontSize: "0.85rem",
            color: "var(--red)",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          style={{
            fontSize: "0.825rem",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
