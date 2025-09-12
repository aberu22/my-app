export function Card({ children }) {
    return <div className="rounded-xl bg-gray-900 border border-gray-700">{children}</div>;
  }
  
  export function CardContent({ children, className = "" }) {
    return <div className={`p-6 ${className}`}>{children}</div>;
  }
  