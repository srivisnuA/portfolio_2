/** Curated from the supplied resumes and public repositories. */
export type Discipline = "software" | "ai" | "analytics";

export type Project = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  category: string;
  disciplines: Discipline[];
  summary: string;
  problem: string;
  contribution: string;
  outcomes: string[];
  stack: string[];
  image: string;
  github?: string;
  demo?: string;
  accent: string;
};

export const profile = {
  name: "Srivisnu A",
  role: "Software Engineering · AI & Machine Learning · Data Analytics",
  description:
    "I build software, find the signal in data, and teach machines to see. Turning curious questions into systems that work.",
  email: "srivisnu824@gmail.com",
  github: "https://github.com/srivisnuA",
  linkedin: "https://www.linkedin.com/in/srivisnu-anand-5714a0210/",
  location: "Chennai, India",
};

export const resumeLinks = [
  { label: "Software Engineering", href: "/resumes/software-engineering.pdf" },
  { label: "AI & Machine Learning", href: "/resumes/ai-ml.pdf" },
  { label: "Data Analytics", href: "/resumes/data-analytics.pdf" },
];

export const skillGroups = [
  {
    title: "Software Engineering",
    items: ["Python", "Java", "JavaScript", "FastAPI", "Flask", "React", "REST APIs", "SQL", "Docker", "GitHub Actions"],
  },
  {
    title: "AI & Machine Learning",
    items: ["PyTorch", "TensorFlow", "Scikit-learn", "YOLOv8", "OpenCV", "FaceNet", "Grad-CAM", "LLM APIs"],
  },
  {
    title: "Data Analytics",
    items: ["Pandas", "NumPy", "SQL", "Excel", "Power BI", "Tableau", "Plotly", "EDA", "Feature Engineering"],
  },
];

/** The four Technical Arsenal groups on the original live portfolio. */
export const arsenalGroups = [
  {
    title: "Software Engineering",
    symbol: "</>",
    description: "The foundations I use to turn an idea into a working system.",
    items: ["Python", "Java", "JavaScript", "SQL", "REST APIs", "Git", "Linux", "Unix Shell Scripting"],
  },
  {
    title: "Data Analytics",
    symbol: "Σ",
    description: "Tools for cleaning the noise, finding patterns, and telling the story.",
    items: ["Pandas", "NumPy", "EDA", "Data Cleaning", "Feature Engineering", "Excel", "Power BI", "Tableau", "Matplotlib", "Seaborn", "Plotly"],
  },
  {
    title: "Data & Machine Learning",
    symbol: "λ",
    description: "From dependable pipelines to experiments that learn from data.",
    items: ["ETL Pipelines", "Web Scraping", "Data Validation", "Scikit-learn", "Regression", "Classification", "Clustering"],
  },
  {
    title: "Databases & Platforms",
    symbol: "{ }",
    description: "The workbench, storage, and queries that connect everything.",
    items: ["MySQL", "PostgreSQL", "SQL Queries", "Joins", "Aggregations", "Jupyter", "VS Code"],
  },
];

export const projects: Project[] = [
  {
    id: "facefare",
    number: "01",
    title: "FaceFare",
    shortTitle: "FaceFare",
    category: "Software Engineering / Computer Vision",
    disciplines: ["software", "ai"],
    summary: "A face becomes a fare. Contactless transit payments powered by real-time computer vision.",
    problem: "Passenger identification and fare collection can slow boarding. FaceFare explores how recognition and automatic wallet transactions can make that handoff faster.",
    contribution: "Built a Flask and Socket.IO prototype connecting face enrollment, OpenCV/FaceNet recognition, trip logic, and atomic SQLite wallet updates. Added a live dashboard, authenticated access, tests, and Docker deployment.",
    outcomes: [
      "33% faster simulated boarding: 6 seconds to 4 seconds per passenger.",
      "12 routes, 5 Socket.IO handlers, and 8 passenger-management API endpoints.",
      "Co-inventor on Indian patent application 202641031039 A, published 3 April 2026.",
    ],
    stack: ["Python", "Flask", "Socket.IO", "FaceNet", "OpenCV", "SQLite", "Docker"],
    image: "/projects/facefare.svg",
    github: "https://github.com/srivisnuA/FaceFare",
    accent: "#d8b981",
  },
  {
    id: "salespilot",
    number: "02",
    title: "SalesPilot AI",
    shortTitle: "SalesPilot",
    category: "Software Engineering / Applied AI / Analytics",
    disciplines: ["software", "ai", "analytics"],
    summary: "From first signal to next action. Explainable lead scoring, outreach, and pipeline intelligence.",
    problem: "Sales teams need to prioritize leads, personalize follow-ups, and understand their pipeline without stitching together disconnected workflows.",
    contribution: "Built a FastAPI and React platform with a relational data model, configurable trigger-action automations, execution history, and an OpenAI-compatible outreach generator with a deterministic fallback.",
    outcomes: [
      "Explainable 0–100 lead scoring from 11 signals using a transparent weighted rules engine.",
      "27 REST endpoints and a 14-table relational schema.",
      "Analytics for funnel conversion, engagement, deal risk, and campaign ROI.",
    ],
    stack: ["Python", "FastAPI", "React", "SQLAlchemy", "Recharts", "LLM APIs"],
    image: "/projects/salespilot.svg",
    github: "https://github.com/srivisnuA/salespilot-ai",
    accent: "#9fb9dc",
  },
  {
    id: "chestxpert",
    number: "03",
    title: "ChestXpert",
    shortTitle: "ChestXpert",
    category: "AI & Machine Learning / Explainability",
    disciplines: ["ai"],
    summary: "Looking beyond a prediction. An explainable chest X-ray classification research prototype.",
    problem: "An image classification result is more useful when its evaluation and the regions that influenced it are visible.",
    contribution: "Developed a multi-label ResNet-18 transfer-learning pipeline with image preprocessing, per-label evaluation, and Grad-CAM visual explanations. Exposed inference through Flask and a Streamlit review interface.",
    outcomes: [
      "A 2,000-image development subset with 14 abnormality labels.",
      "1,582 training images and 418 held-out images.",
      "DICOM, PNG, and JPEG preprocessing with AUROC, Average Precision, precision, recall, and F1 evaluation.",
    ],
    stack: ["Python", "PyTorch", "ResNet-18", "Grad-CAM", "Flask", "Streamlit", "DICOM"],
    image: "/projects/chestxpert.svg",
    accent: "#b4a3d8",
  },
  {
    id: "refueling-safety",
    number: "04",
    title: "Refueling Safety & Fraud Detection",
    shortTitle: "Refueling Safety",
    category: "AI & Machine Learning / Computer Vision",
    disciplines: ["ai", "software"],
    summary: "A second pair of eyes at the pump. A vision pipeline for refueling safety and anomaly alerts.",
    problem: "Nozzle movement, vehicle motion, fire, and inconsistent meter readings can create safety and fraud risks during refueling.",
    contribution: "Combined YOLOv8 detection stages for the nozzle, vehicle, pose, and fire/smoke with spatial checks, OCR-oriented meter extraction, and a Flask monitoring dashboard.",
    outcomes: [
      "Four model inference stages feed a five-state alert engine.",
      "Real-time visual monitoring and anomaly alerts.",
      "Developed for ACE-Hacks 2025, conducted in collaboration with Renault’s AI Lab.",
    ],
    stack: ["Python", "YOLOv8", "PyTorch", "OpenCV", "OCR", "Flask"],
    image: "/projects/refueling-safety.svg",
    github: "https://github.com/srivisnuA/Vision-Based-Safety-Lapse-Detection-During-Vehicle-Refueling",
    accent: "#91bcb8",
  },
  {
    id: "customer-segmentation",
    number: "05",
    title: "Customer Behavior & Segmentation",
    shortTitle: "Customer Signals",
    category: "Data Analytics / Unsupervised Learning",
    disciplines: ["analytics", "ai"],
    summary: "Finding the people behind the patterns. Customer segments made understandable through data.",
    problem: "A customer dataset becomes actionable when its patterns can be explained and compared across meaningful groups.",
    contribution: "Cleaned and explored customer records, engineered features, applied scaling and PCA, and used K-Means clustering. Translated segment differences into Excel and Tableau dashboards.",
    outcomes: [
      "Analyzed 1,000 customer records.",
      "Identified six behavioral customer segments.",
      "Presented distributions and segment characteristics through visual dashboards.",
    ],
    stack: ["Python", "Pandas", "NumPy", "Scikit-learn", "Excel", "Tableau"],
    image: "/projects/customer-segmentation.svg",
    github: "https://github.com/srivisnuA/customer-segmentation-analysis",
    accent: "#c7aa7f",
  },
  {
    id: "stock-analysis",
    number: "06",
    title: "Historical Stock Analysis & Prediction",
    shortTitle: "Market Patterns",
    category: "Data Analytics / Predictive Modeling",
    disciplines: ["analytics", "ai"],
    summary: "Turning market history into an analytical story. Collection, exploration, and forecasting in one pipeline.",
    problem: "Price and revenue data live in different places. Bringing them together makes historical trends easier to explore and modeling assumptions easier to inspect.",
    contribution: "Built a Python pipeline using yfinance and web scraping, cleaned AAPL historical data, visualized prices and revenue, and evaluated a Random Forest regressor with a chronological train/test split.",
    outcomes: [
      "Four years of historical AAPL data, covering 2020–2024.",
      "A 100-estimator Random Forest and an 80/20 chronological split.",
      "An experimental 30-day forecast with interactive historical visualizations.",
    ],
    stack: ["Python", "Pandas", "Scikit-learn", "Plotly", "BeautifulSoup", "yfinance"],
    image: "/projects/stock-analysis.svg",
    github: "https://github.com/srivisnuA/Historical-stock-price-prediction",
    accent: "#95b6c7",
  },
  {
    id: "isro-enhancement",
    number: "07",
    title: "ISRO OHRC Image Enhancement",
    shortTitle: "Lunar Vision",
    category: "Computer Vision / Image Processing",
    disciplines: ["ai", "software"],
    summary: "Bringing detail out of the dark. An interactive image enhancement tool for low-light imagery.",
    problem: "Low illumination can hide useful image detail. An interactive workflow makes enhancement settings easier to explore, compare, and export.",
    contribution: "Developed a Python desktop image-processing interface with brightness, contrast, and gamma controls, annotation tools, and image export.",
    outcomes: [
      "Interactive enhancement controls in a PyQt5 desktop interface.",
      "Image upload, annotation, and export in one workflow.",
      "OpenCV and NumPy image-processing operations.",
    ],
    stack: ["Python", "OpenCV", "NumPy", "PyQt5", "Pillow"],
    image: "/projects/isro-enhancement.svg",
    github: "https://github.com/srivisnuA/Low-light-enhancement-of-ISRO-S-OHRC-image",
    accent: "#c8c6b9",
  },
];
