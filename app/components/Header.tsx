interface HeaderProps {
  isExpertMode?: boolean;
}

export default function Header({ isExpertMode = false }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        marginBottom: "20px",
        paddingTop: "20px",
        flexWrap: "wrap",
      }}
    >
      <img
        src="/Wellcome_Trust_logo.svg"
        alt="Wellcome Trust"
        style={{
          height: "60px",
          maxWidth: "200px",
          objectFit: "contain",
        }}
      />
      <h1 style={{ margin: 0 }}>
        {isExpertMode ? "Expert Mode - " : ""}Name Reconciliation Service
        Evaluation
      </h1>
    </div>
  );
}
