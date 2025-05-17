# Frontend Documentation

## Architecture
The frontend is built using Next.js 13 with the App Router, providing a modern, server-side rendered React application with excellent performance and SEO capabilities.

## Key Features

### Learning Modules

#### 1. Alphabet Learning (`/learn/alphabet`)
- Interactive alphabet learning interface
- Different forms of each letter (initial, medial, final)
- Writing practice component
- Audio pronunciation support
- Progress tracking

#### 2. Diacritics (`/learn/diacritics`)
- Learn Arabic diacritical marks
- Interactive examples
- Practice exercises
- Audio support for correct pronunciation

#### 3. Syllables (`/learn/syllables`)
- Structured syllable learning
- Pattern recognition
- Common word examples
- Writing practice

#### 4. Words (`/learn/words`)
- Categorized vocabulary learning
- Interactive word cards
- Audio pronunciation
- Practice exercises
- Progress tracking

#### 5. Sentences (`/learn/sentences`)
- Simple to complex sentences
- Multiple exercise types:
  - Multiple choice
  - Arrange words
  - Complete sentences
- Audio support
- Progress tracking

#### 6. Stories (`/learn/stories`)
- Interactive story reading
- Vocabulary learning
- Comprehension questions
- Progress tracking
- Review system

### User Interface Components

#### Common Components
- `Button`: Custom button component with various styles
- `Card`: Container component for content sections
- `Input`: Text input component
- `Label`: Form label component
- `Progress`: Progress bar for tracking completion
- `Switch`: Toggle switch for settings
- `Tabs`: Content organization component
- `ScrollArea`: Scrollable container with custom styling

#### Learning Components
- `WritingPractice`: Canvas-based component for letter practice
- `SpeechReader`: Text-to-speech component for pronunciation
- `CelebrationEffects`: Animation component for achievements
- `LetterForms`: Display component for Arabic letter forms

### State Management
- Local state using React hooks
- Server state management with SWR
- Progress persistence using local storage and API
- User preferences synchronization

### Styling
- Tailwind CSS for utility-first styling
- Custom theme configuration
- RTL support for Arabic text
- Responsive design for all screen sizes

### Animations
- Framer Motion for smooth transitions
- Loading states and skeletons
- Interactive feedback animations
- Achievement celebrations

### Navigation
- Next.js App Router for routing
- Protected routes with authentication
- Progress-based level unlocking
- Breadcrumb navigation

### User Experience
- Toast notifications for feedback
- Loading states
- Error handling
- Offline support
- Responsive design
- Accessibility features

## Component Structure
```
components/
├── ui/                 # Base UI components
├── learning/          # Learning-specific components
├── layout/           # Layout components
└── icons/            # Icon components
```

## Pages Structure
```
app/
├── (auth)/           # Authentication pages
├── dashboard/        # User dashboard
├── learn/           # Learning modules
│   ├── alphabet/
│   ├── diacritics/
│   ├── syllables/
│   ├── words/
│   ├── sentences/
│   └── stories/
├── profile/         # User profile
└── lessons/         # Individual lessons
```

## State Management
The application uses a combination of:
- React hooks for local state
- Context API for theme and user preferences
- SWR for server state
- Local storage for progress persistence

## API Integration
- RESTful API consumption
- JWT authentication
- Progress synchronization
- User data management
- Error handling

## Performance Optimization
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies
- Performance monitoring

## Testing
- Jest for unit testing
- React Testing Library for component testing
- Cypress for E2E testing
- Accessibility testing

## Build and Deployment
- Next.js build optimization
- Environment configuration
- Deployment scripts
- CI/CD integration

For detailed setup instructions, see the [Getting Started Guide](../getting-started.md). 