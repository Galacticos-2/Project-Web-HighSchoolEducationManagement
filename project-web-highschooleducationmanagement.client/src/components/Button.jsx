import "../styles/button.css";

export default function Button({
    children,
    variant = "primary",
    type = "button",
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            className={`app-btn app-btn-${variant} ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}