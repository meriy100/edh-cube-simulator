"use client";

type Props = {
  symbol: string; // 'w', 'u', 'b', 'r', 'g', 'c', '10' など
  size?: "2x" | "3x"; // 大きさの指定（任意）
  shadow?: boolean; // 影をつけるかどうか
  className?: string;
};

const ManaSymbol = ({ symbol, size, shadow, className = "" }: Props) => {
  // 小文字に変換し、ms- を付与
  const symbolName = symbol.toLowerCase();
  const classes = [
    "ms",
    `ms-${symbolName}`,
    size ? `ms-${size}` : "",
    shadow ? "ms-shadow" : "",
    "ms-cost",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <i className={classes} title={symbol.toUpperCase()} />;
};

export default ManaSymbol;
