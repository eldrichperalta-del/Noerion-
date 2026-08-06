const setAMultipleChoice = [
  {
    id: 1,
    question:
      "What device serves as the main permanent storage inside a desktop computer?",
    choices: ["RAM", "BIOS", "Hard Drive", "Processor"],
    answer: "Hard Drive",
  },
  {
    id: 2,
    question:
      'Which component acts as the "brain" of the computer for processing data?',
    choices: ["PSU", "CPU", "Motherboard", "Case Fan"],
    answer: "CPU",
  },
  {
    id: 3,
    question: 'What does the acronym "BIOS" stand for?',
    choices: [
      "Basic Input Output System",
      "Binary Input Output Software",
      "Basic Integrated Operating System",
      "Basic Internal Operating System",
    ],
    answer: "Basic Input Output System",
  },
  {
    id: 4,
    question:
      "Which memory type is volatile and loses data when power is cut?",
    choices: ["ROM", "HDD", "Flash Drive", "RAM"],
    answer: "RAM",
  },
  {
    id: 5,
    question: "What is the primary purpose of an IP address in a network?",
    choices: [
      "To store files",
      "To identify a device",
      "To increase speed",
      "To cool the CPU",
    ],
    answer: "To identify a device",
  },
  {
    id: 6,
    question:
      "Why is a network switch more efficient than a hub in a busy office?",
    choices: [
      "It is cheaper",
      "It sends data only to the target device",
      "It is wireless",
      "It has more ports",
    ],
    answer: "It sends data only to the target device",
  },
  {
    id: 7,
    question: "What is the purpose of partitioning a hard drive?",
    choices: [
      "To increase storage capacity",
      "To organize data into logical sections",
      "To overclock the PC",
      "To clean the registry",
    ],
    answer: "To organize data into logical sections",
  },
  {
    id: 8,
    question:
      "Why is using an anti-static strap mandatory when handling a motherboard?",
    choices: [
      "To avoid electric shock",
      "To prevent static electricity damaging circuits",
      "To ground the cable",
      "To keep the motherboard steady",
    ],
    answer: "To prevent static electricity damaging circuits",
  },
  {
    id: 9,
    question:
      "Which command verifies if a computer is connected to the network?",
    choices: ["ipconfig", "ping", "dir", "cls"],
    answer: "ping",
  },
  {
    id: 10,
    question:
      "What is the standard wire color order for a straight-through LAN cable?",
    choices: ["T568A/T568B", "Crossover", "USB-C", "T568C"],
    answer: "T568A/T568B",
  },
  {
    id: 11,
    question:
      "What command helps you release and renew an IP address from a DHCP server?",
    choices: [
      "ping /renew",
      "ipconfig /renew",
      "reset /ip",
      "ipconfig /flushdns",
    ],
    answer: "ipconfig /renew",
  },
  {
    id: 12,
    question:
      "Which tool is used to test if a network cable has continuity or shorts?",
    choices: ["Multimeter", "LAN Tester", "Screwdriver", "Pliers"],
    answer: "LAN Tester",
  },
  {
    id: 13,
    question:
      "If a PC beeps and fails to POST, which component is the most logical first suspect?",
    choices: ["Monitor", "RAM/CPU", "Mouse", "Keyboard"],
    answer: "RAM/CPU",
  },
  {
    id: 14,
    question:
      "If a network cable is damaged, what is the most likely symptom?",
    choices: [
      "PC turns off",
      "No network connectivity",
      "Blue screen",
      "Overheating",
    ],
    answer: "No network connectivity",
  },
  {
    id: 15,
    question:
      "Why would a computer performance drop significantly when the CPU overheats?",
    choices: [
      "Thermal Throttling",
      "Virus infection",
      "HDD failure",
      "RAM corruption",
    ],
    answer: "Thermal Throttling",
  },
].map((item) => ({
  ...item,
  type: "Multiple Choice",
}));

const setATrueFalse = [
  {
    id: 16,
    question:
      "A 150-meter UTP cable will maintain signal integrity without a repeater.",
    answer: "False",
  },
  {
    id: 17,
    question:
      "If a computer restarts spontaneously, a failing power supply unit is a common cause.",
    answer: "True",
  },
  {
    id: 18,
    question:
      "Using a strong, complex password is less effective than using no password at all.",
    answer: "False",
  },
  {
    id: 19,
    question:
      "RAID 0 is the recommended RAID level for protecting critical financial data.",
    answer: "False",
  },
  {
    id: 20,
    question:
      "Installing an anti-virus program is sufficient to protect a system from all hardware failures.",
    answer: "False",
  },
].map((item) => ({
  ...item,
  type: "True / False",
}));

const setAIdentification = [
  {
    id: 26,
    question:
      "Maintenance process of removing dust to prevent short circuits.",
    answer: "Cleaning / Dusting",
  },
  {
    id: 27,
    question:
      'The "blue screen" error code known as when Windows crashes.',
    answer: "BSOD (Blue Screen of Death)",
  },
  {
    id: 28,
    question:
      "Windows utility best to scan and fix disk errors and bad sectors.",
    answer: "CHKDSK",
  },
  {
    id: 29,
    question:
      "The process of re-organizing file fragments on a disk for speed.",
    answer: "Defragmentation",
  },
  {
    id: 30,
    question:
      "If you suspect a PC is infected, this is the most reliable way to verify it.",
    answer: "Antivirus Scan / Malware Scan",
  },
].map((item) => ({
  ...item,
  type: "Identification",
}));

const setASituationalAnalysis = [
  {
    id: 31,
    question: "If a hard drive fails, what is the #1 priority step?",
    choices: ["Format the drive", "Data recovery", "Replace RAM", "Update BIOS"],
    answer: "Data recovery",
  },
  {
    id: 32,
    question: "What is the best strategy to keep a 40-PC lab running smoothly?",
    choices: [
      "Reactive repair",
      "Planned maintenance",
      "Update only when broken",
      "Weekly reformat",
    ],
    answer: "Planned maintenance",
  },
  {
    id: 33,
    question: "A PC has no power. What do you check first?",
    choices: ["The monitor", "Power source and cable", "The keyboard", "The mouse"],
    answer: "Power source and cable",
  },
  {
    id: 34,
    question:
      'How do you safely separate "Guest Wi-Fi" from the office network?',
    choices: ["Use a long password", "Hide the SSID", "Configure a VLAN", "Turn off Wi-Fi"],
    answer: "Configure a VLAN",
  },
  {
    id: 35,
    question: "How do you block unauthorized websites in an office?",
    choices: [
      "Firewall/Proxy settings",
      "Disable the internet",
      "Unplug cables",
      "Delete history",
    ],
    answer: "Firewall/Proxy settings",
  },
  {
    id: 36,
    question: "What is the most critical item to install on a new computer?",
    choices: ["Games", "Security/Antivirus", "Desktop themes", "Screen saver"],
    answer: "Security/Antivirus",
  },
  {
    id: 37,
    question: "If your office power is unstable, what device should you purchase?",
    choices: ["UPS", "HDMI cable", "USB Hub", "Monitor"],
    answer: "UPS",
  },
  {
    id: 38,
    question: "What is the most reliable backup plan for a company?",
    choices: [
      "Keep files on the Desktop",
      "Email files to self",
      "Automated backup schedule",
      "No backups",
    ],
    answer: "Automated backup schedule",
  },
  {
    id: 39,
    question: "A user forgets their login password. How do you handle this?",
    choices: ["Guess it", "Use Admin tools to reset", "Reformat the PC", "Ignore the user"],
    answer: "Use Admin tools to reset",
  },
  {
    id: 40,
    question: "If a PC is slow, what is the most effective hardware upgrade?",
    choices: ["More RAM/SSD", "New Case", "New Monitor", "New Keyboard"],
    answer: "More RAM/SSD",
  },
].map((item) => ({
  ...item,
  type: "Multiple Choice",
}));

export const mockAssessments = [
  {
    id: 1,
    title: "Computer Systems Servicing NC II",
    qualification: "Computer Systems Servicing NC II",
    unitOfCompetency:
      "COC1 - Install and Configure Computer Systems",
    assessor: "Engr. J. Dela Cruz",
    instructions: "Read every question carefully and select the most accurate answer.",
    createdDate: "Jan 10, 2026",
    lastUpdated: "Jul 31, 2026",
    schedule: "April 14, 2025 - 09:00 AM",
    status: "Pending",
    durationMinutes: 40,
    totalItems: 40,
    assessmentType: "Written",
    questions: [
      ...setAMultipleChoice,
      ...setATrueFalse,
      {
        id: 21,
        type: "Matching Type",
        itemRange: "21-25",
        itemCount: 5,
        question:
          "Match the symptom/concept in Column A to the correct technical assessment in Column B.",
        pairs: [
          {
            itemNumber: 21,
            left: "Clicking noise in HDD",
            right: "Indicates physical drive mechanical failure",
            answer: "B",
          },
          {
            itemNumber: 22,
            left: "ping command",
            right: "Used to test if two PCs can communicate",
            answer: "C",
          },
          {
            itemNumber: 23,
            left: "NTFS File System",
            right: "Best for storing files larger than 4GB",
            answer: "D",
          },
          {
            itemNumber: 24,
            left: "Firewall",
            right: "Protects the network from unauthorized traffic",
            answer: "E",
          },
          {
            itemNumber: 25,
            left: "Thermal Throttling",
            right: "CPU slows down speed to reduce heat",
            answer: "A",
          },
        ],
        options: [
          {
            letter: "A",
            description: "CPU slows down speed to reduce heat",
          },
          {
            letter: "B",
            description: "Indicates physical drive mechanical failure",
          },
          {
            letter: "C",
            description: "Used to test if two PCs can communicate",
          },
          {
            letter: "D",
            description: "Best for storing files larger than 4GB",
          },
          {
            letter: "E",
            description: "Protects the network from unauthorized traffic",
          },
        ],
      },
      ...setAIdentification,
      ...setASituationalAnalysis,
    ],
  },
  {
    id: 2,
    title: "Web Application Development",
    qualification: "TESDA NC IV IT",
    unitOfCompetency: "Develop responsive web applications",
    assessor: "Ms. A. Santos",
    instructions: "Complete all questions based on the web development competencies covered.",
    createdDate: "Jan 12, 2026",
    lastUpdated: "Jul 30, 2026",
    schedule: "April 16, 2025 - 01:00 PM",
    status: "Pending",
    durationMinutes: 30,
    totalItems: 2,
    assessmentType: "Written",
    questions: [
      {
        id: 201,
        type: "Multiple Choice",
        question:
          "Which HTML element is used to load an external JavaScript file?",
        choices: ["<style>", "<script>", "<link>", "<meta>"],
        answer: "<script>",
      },
      {
        id: 202,
        type: "True / False",
        question:
          "CSS media queries can be used to apply styles at different viewport sizes.",
        answer: "True",
      },
    ],
  },
  {
    id: 3,
    title: "Culinary Arts Technique",
    qualification: "TESDA NC II Cookery",
    unitOfCompetency: "Prepare and cook hot meals",
    assessor: "Chef R. Garcia",
    instructions: "Answer each question using the correct culinary term or technique.",
    createdDate: "Jan 8, 2026",
    lastUpdated: "Jul 28, 2026",
    schedule: "Completed - April 10, 2025",
    status: "Completed",
    durationMinutes: 25,
    totalItems: 1,
    assessmentType: "Written",
    questions: [
      {
        id: 301,
        type: "Identification",
        question:
          "What kitchen term means to cook food gently in liquid just below boiling point?",
        answer: "Simmer",
      },
    ],
  },
  {
    id: 4,
    title: "Industrial Electronics",
    qualification: "TESDA NC III Electronics",
    unitOfCompetency: "Maintain industrial electronic systems",
    assessor: "Mr. L. Hernandez",
    instructions: "Choose the correct answer for each industrial electronics question.",
    createdDate: "Jan 15, 2026",
    lastUpdated: "Aug 1, 2026",
    schedule: "April 17, 2025 - 02:00 PM",
    status: "Pending",
    durationMinutes: 20,
    totalItems: 1,
    assessmentType: "Written",
    questions: [
      {
        id: 401,
        type: "True / False",
        question:
          "A multimeter can measure voltage, current, and resistance.",
        answer: "True",
      },
    ],
  },
];

export const getMockAssessmentById = (id) =>
  mockAssessments.find((assessment) => String(assessment.id) === String(id));

export const addMockAssessment = (assessment) => {
  mockAssessments.push(assessment);
  return assessment;
};
