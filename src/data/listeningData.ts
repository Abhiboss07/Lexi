export interface ListeningPhrase {
  id: string;
  text: string;
  speaker?: string;
  cueNote?: string;
}

export interface ListeningShortAnswer {
  question: string;
  acceptedAnswers: string[];
  explanation: string;
  sampleAnswer: string;
}

export interface ListeningScenario {
  id: string;
  title: string;
  scenario: string;
  level: string; // e.g. 'A1 • Beginner', 'A2 • Practical Travel', 'B1 • Everyday Fluency', 'B2 • Professional & Nuanced'
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  accent: 'en-US' | 'en-GB' | 'en-AU';
  dialogueText: string;
  phrases: ListeningPhrase[];
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  shortAnswer?: ListeningShortAnswer;
  keyPhrases: string[];
  dictationSentence: string;
  contextBackground: string;
}

export const LISTENING_SCENARIOS: ListeningScenario[] = [
  {
    id: 'train-platform',
    title: 'Train Platform Announcement',
    scenario: 'Train Platform Announcement',
    level: 'A2 • Practical Travel',
    cefrLevel: 'A2',
    accent: 'en-GB',
    contextBackground: 'You are waiting on a train platform in London during a busy morning commute.',
    dialogueText:
      "Attention passengers on Platform 3. The 10:45 express train to Oxford has been delayed by approximately 15 minutes due to routine signal maintenance. Please keep your luggage with you at all times.",
    phrases: [
      { id: 'tp-1', speaker: 'Station Announcer', text: 'Passengers on Platform 3, please note:', cueNote: 'Initial chime and station call' },
      { id: 'tp-2', speaker: 'Station Announcer', text: 'The 10:45 express train to Oxford has been delayed by approximately 15 minutes', cueNote: 'Key delay information' },
      { id: 'tp-3', speaker: 'Station Announcer', text: 'due to routine signal maintenance.', cueNote: 'Official reason' },
      { id: 'tp-4', speaker: 'Station Announcer', text: 'Please keep your luggage with you at all times.', cueNote: 'Standard safety reminder' },
    ],
    question: 'How long is the train delayed?',
    options: ['5 minutes', '15 minutes', '45 minutes'],
    correctIndex: 1,
    explanation: "The announcer stated that the 10:45 train is delayed by 'approximately 15 minutes'.",
    shortAnswer: {
      question: 'What is the destination of the delayed train?',
      acceptedAnswers: ['oxford', 'to oxford', 'the train is going to oxford', 'oxford station'],
      explanation: "The announcement explicitly specifies 'the 10:45 express train to Oxford'.",
      sampleAnswer: 'Oxford',
    },
    keyPhrases: ['Attention passengers', 'delayed by approximately', 'routine maintenance', 'Platform 3'],
    dictationSentence: 'The express train to Oxford has been delayed by 15 minutes.',
  },
  {
    id: 'cafe-order',
    title: 'Ordering at a London Bakery',
    scenario: 'London Bakery Counter',
    level: 'A1 • Everyday Conversation',
    cefrLevel: 'A1',
    accent: 'en-GB',
    contextBackground: 'You are ordering breakfast at a neighborhood artisan bakery in Soho.',
    dialogueText:
      "Good morning! Would you like that croissant warmed up, and would that be whole milk or oat milk with your flat white today?",
    phrases: [
      { id: 'co-1', speaker: 'Barista', text: 'Good morning!', cueNote: 'Friendly greeting' },
      { id: 'co-2', speaker: 'Barista', text: 'Would you like that croissant warmed up,', cueNote: 'Pastry preparation preference' },
      { id: 'co-3', speaker: 'Barista', text: 'and would that be whole milk or oat milk with your flat white today?', cueNote: 'Milk choices for coffee' },
    ],
    question: 'What beverage is the customer ordering?',
    options: ['A cup of Earl Grey tea', 'An iced americano', 'A flat white coffee'],
    correctIndex: 2,
    explanation: "The barista asks whether the customer prefers whole milk or oat milk with their flat white.",
    shortAnswer: {
      question: 'What pastry does the barista ask about heating up?',
      acceptedAnswers: ['croissant', 'a croissant', 'the croissant'],
      explanation: "The barista asks: 'Would you like that croissant warmed up?'",
      sampleAnswer: 'A croissant',
    },
    keyPhrases: ['Good morning', 'warmed up', 'flat white', 'oat milk'],
    dictationSentence: 'Would that be whole milk or oat milk with your coffee?',
  },
  {
    id: 'flight-gate-change',
    title: 'Airport Gate & Boarding Update',
    scenario: 'International Airport Terminal',
    level: 'B1 • Travel Navigation',
    cefrLevel: 'B1',
    accent: 'en-US',
    contextBackground: 'You are seated in the departure lounge waiting for your connecting domestic flight.',
    dialogueText:
      "Ladies and gentlemen, flight 402 with non-stop service to Seattle will now board from Gate B12 instead of Gate B4. Boarding will commence in approximately ten minutes for passengers requiring special assistance.",
    phrases: [
      { id: 'fg-1', speaker: 'Gate Agent', text: 'Ladies and gentlemen, flight 402 with non-stop service to Seattle', cueNote: 'Flight identifier and destination' },
      { id: 'fg-2', speaker: 'Gate Agent', text: 'will now board from Gate B12 instead of Gate B4.', cueNote: 'Crucial gate relocation detail' },
      { id: 'fg-3', speaker: 'Gate Agent', text: 'Boarding will commence in approximately ten minutes for passengers requiring special assistance.', cueNote: 'Boarding sequence priority' },
    ],
    question: 'Which gate is flight 402 now boarding from?',
    options: ['Gate B4', 'Gate B12', 'Gate B10'],
    correctIndex: 1,
    explanation: "The gate has changed from B4 to Gate B12.",
    shortAnswer: {
      question: 'In how many minutes will priority boarding commence?',
      acceptedAnswers: ['10', '10 minutes', 'ten', 'ten minutes', 'approximately ten minutes'],
      explanation: "The announcement states that boarding will commence in approximately ten minutes.",
      sampleAnswer: '10 minutes',
    },
    keyPhrases: ['non-stop service', 'board from Gate B12', 'commence in ten minutes'],
    dictationSentence: 'Flight 402 with non-stop service will board from Gate B12.',
  },
  {
    id: 'hotel-checkin',
    title: 'Boutique Hotel Front Desk Check-in',
    scenario: 'Hotel Front Desk',
    level: 'A2 • Practical Hospitality',
    cefrLevel: 'A2',
    accent: 'en-US',
    contextBackground: 'You just arrived at a downtown hotel after a long journey.',
    dialogueText:
      "Welcome to the Grandview Hotel! Here are your two key cards for room 416 on the fourth floor. Complimentary breakfast is served in the courtyard from 7:00 to 10:30 every morning.",
    phrases: [
      { id: 'hc-1', speaker: 'Receptionist', text: 'Welcome to the Grandview Hotel!', cueNote: 'Warm hospitality greeting' },
      { id: 'hc-2', speaker: 'Receptionist', text: 'Here are your two key cards for room 416 on the fourth floor.', cueNote: 'Room assignment and keys' },
      { id: 'hc-3', speaker: 'Receptionist', text: 'Complimentary breakfast is served in the courtyard from 7:00 to 10:30 every morning.', cueNote: 'Dining location and hours' },
    ],
    question: 'What time does the complimentary breakfast end in the morning?',
    options: ['9:30 AM', '10:00 AM', '10:30 AM'],
    correctIndex: 2,
    explanation: "The receptionist specifies that breakfast is served from 7:00 to 10:30 every morning.",
    shortAnswer: {
      question: 'Where is complimentary breakfast served in the hotel?',
      acceptedAnswers: ['in the courtyard', 'courtyard', 'the courtyard'],
      explanation: "The receptionist states: 'breakfast is served in the courtyard'.",
      sampleAnswer: 'In the courtyard',
    },
    keyPhrases: ['key cards for room 416', 'complimentary breakfast', 'in the courtyard', '7:00 to 10:30'],
    dictationSentence: 'Complimentary breakfast is served in the courtyard every morning.',
  },
  {
    id: 'doctor-appointment',
    title: 'Clinic Consultation & Medication Advice',
    scenario: 'Medical Clinic Office',
    level: 'B1 • Health & Well-being',
    cefrLevel: 'B1',
    accent: 'en-GB',
    contextBackground: 'A physician is explaining how to take a prescribed medication safely.',
    dialogueText:
      "I am prescribing an antibiotic for your sinus infection. You need to take one tablet twice daily with food, preferably in the morning and evening. Be sure to finish the full seven-day course even if you start feeling better sooner.",
    phrases: [
      { id: 'da-1', speaker: 'Dr. Edwards', text: 'I am prescribing an antibiotic for your sinus infection.', cueNote: 'Medical diagnosis & treatment' },
      { id: 'da-2', speaker: 'Dr. Edwards', text: 'You need to take one tablet twice daily with food, preferably in the morning and evening.', cueNote: 'Dosage and food instruction' },
      { id: 'da-3', speaker: 'Dr. Edwards', text: 'Be sure to finish the full seven-day course even if you start feeling better sooner.', cueNote: 'Course completion requirement' },
    ],
    question: 'How should the patient take the medication?',
    options: ['Once daily on an empty stomach', 'One tablet twice daily with food', 'Three times daily before meals'],
    correctIndex: 1,
    explanation: "The doctor explicitly instructs the patient to take one tablet twice daily with food.",
    shortAnswer: {
      question: 'How many days should the antibiotic course last?',
      acceptedAnswers: ['7', '7 days', 'seven', 'seven days', 'a week'],
      explanation: "The physician instructs: 'Be sure to finish the full seven-day course'.",
      sampleAnswer: '7 days',
    },
    keyPhrases: ['prescribing an antibiotic', 'twice daily with food', 'finish the full course', 'seven-day course'],
    dictationSentence: 'You need to take one tablet twice daily with food.',
  },
  {
    id: 'workplace-standup',
    title: 'Product Engineering Standup Update',
    scenario: 'Agile Team Sync',
    level: 'B2 • Professional & Workplace',
    cefrLevel: 'B2',
    accent: 'en-US',
    contextBackground: 'A senior product engineer gives a quick status report during morning standup.',
    dialogueText:
      "Good morning team. Yesterday I resolved the latency issue in the authentication pipeline by optimizing our database indexing. Today, I'll be finishing code reviews for the checkout refactor and coordinating with QA to deploy staging build 3.4 by 3 PM.",
    phrases: [
      { id: 'ws-1', speaker: 'Lead Engineer', text: 'Good morning team.', cueNote: 'Sync opening' },
      { id: 'ws-2', speaker: 'Lead Engineer', text: 'Yesterday I resolved the latency issue in the authentication pipeline by optimizing our database indexing.', cueNote: 'Accomplishment and technical fix' },
      { id: 'ws-3', speaker: 'Lead Engineer', text: "Today, I'll be finishing code reviews for the checkout refactor and coordinating with QA to deploy staging build 3.4 by 3 PM.", cueNote: 'Planned milestone and deadline' },
    ],
    question: 'How did the engineer resolve the authentication latency issue?',
    options: ['By purchasing faster cloud servers', 'By optimizing database indexing', 'By rewriting the user frontend'],
    correctIndex: 1,
    explanation: "The speaker stated they resolved latency 'by optimizing our database indexing'.",
    shortAnswer: {
      question: 'By what time does the engineer plan to deploy the staging build?',
      acceptedAnswers: ['3 pm', '3:00 pm', '3pm', '3', 'by 3 pm', '3:00'],
      explanation: "The engineer says: 'deploy staging build 3.4 by 3 PM'.",
      sampleAnswer: '3 PM',
    },
    keyPhrases: ['resolved the latency issue', 'authentication pipeline', 'database indexing', 'deploy staging build'],
    dictationSentence: 'I resolved the latency issue by optimizing our database indexing.',
  },
];
