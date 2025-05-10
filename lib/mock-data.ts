// Mock users data
export const mockUsers = [
  {
    id: "admin1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    avatar: "",
  },
  {
    id: "teacher1",
    name: "John Smith",
    email: "teacher@example.com",
    role: "teacher",
    avatar: "",
  },
  {
    id: "student1",
    name: "Jane Doe",
    email: "student@example.com",
    role: "student",
    avatar: "",
  },
]

// Mock students data
export const mockStudents = [
  {
    id: "student1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    studentId: "S10001",
    avatar: "",
  },
  {
    id: "student2",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    studentId: "S10002",
    avatar: "",
  },
  {
    id: "student3",
    firstName: "Emily",
    lastName: "Johnson",
    email: "emily.johnson@example.com",
    studentId: "S10003",
    avatar: "",
  },
  {
    id: "student4",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@example.com",
    studentId: "S10004",
    avatar: "",
  },
  {
    id: "student5",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.wilson@example.com",
    studentId: "S10005",
    avatar: "",
  },
]

// Mock courses data
export const mockCourses = [
  {
    id: "course1",
    title: "Introduction to Computer Science",
    code: "CS101",
    department: "Computer Science",
    description:
      "An introductory course covering the basics of computer science, including programming concepts, algorithms, and data structures.",
    credits: 3,
    enrolledStudents: ["student1", "student2", "student3"],
    tags: ["Programming", "Algorithms", "Beginner"],
  },
  {
    id: "course2",
    title: "Advanced Mathematics",
    code: "MATH301",
    department: "Mathematics",
    description: "An advanced course in mathematics covering calculus, linear algebra, and differential equations.",
    credits: 4,
    enrolledStudents: ["student1", "student4"],
    tags: ["Calculus", "Linear Algebra", "Advanced"],
  },
  {
    id: "course3",
    title: "Introduction to Psychology",
    code: "PSYC101",
    department: "Psychology",
    description:
      "An introduction to the fundamental principles of psychology, including the study of behavior and mental processes.",
    credits: 3,
    enrolledStudents: ["student2", "student5"],
    tags: ["Behavior", "Mental Processes", "Beginner"],
  },
  {
    id: "course4",
    title: "Web Development",
    code: "CS205",
    department: "Computer Science",
    description: "A comprehensive course on web development, covering HTML, CSS, JavaScript, and modern frameworks.",
    credits: 3,
    enrolledStudents: ["student1", "student3", "student5"],
    tags: ["HTML", "CSS", "JavaScript", "Frameworks"],
  },
  {
    id: "course5",
    title: "Data Science Fundamentals",
    code: "DS101",
    department: "Data Science",
    description:
      "An introduction to data science concepts, including data analysis, visualization, and machine learning basics.",
    credits: 4,
    enrolledStudents: ["student4"],
    tags: ["Data Analysis", "Visualization", "Machine Learning"],
  },
]

// Mock assignments data
export const mockAssignments = [
  {
    id: "assignment1",
    courseId: "course1",
    title: "Programming Basics",
    description: "Implement a simple calculator program using the programming language of your choice.",
    dueDate: "2023-06-15",
    points: 100,
  },
  {
    id: "assignment2",
    courseId: "course1",
    title: "Algorithm Analysis",
    description: "Analyze the time and space complexity of the provided algorithms.",
    dueDate: "2023-06-30",
    points: 150,
  },
  {
    id: "assignment3",
    courseId: "course2",
    title: "Calculus Problem Set",
    description: "Solve the provided calculus problems, showing all work and steps.",
    dueDate: "2023-06-20",
    points: 100,
  },
  {
    id: "assignment4",
    courseId: "course3",
    title: "Psychology Research Paper",
    description: "Write a research paper on a psychological theory of your choice.",
    dueDate: "2023-07-10",
    points: 200,
  },
  {
    id: "assignment5",
    courseId: "course4",
    title: "Personal Portfolio Website",
    description: "Create a personal portfolio website using HTML, CSS, and JavaScript.",
    dueDate: "2023-07-05",
    points: 150,
  },
  {
    id: "assignment6",
    courseId: "course5",
    title: "Data Analysis Project",
    description: "Analyze the provided dataset and create visualizations to present your findings.",
    dueDate: "2023-07-15",
    points: 200,
  },
]
