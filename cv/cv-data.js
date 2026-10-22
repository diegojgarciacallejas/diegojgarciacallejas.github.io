/* Los datos del currículum, en español y en inglés. Edita aquí: el diseño está en cv.css y cv.js.
   pdf: los PDF de esta carpeta (cv/) que se ofrecen para descargar (sin datos privados: todo lo de cv/ se publica).
   Ojo: todo lo que esté en cv/ se publica. */
var CV = {
  name: 'Diego José García Callejas',
  email: ['d.j.garciacallejas', 'gmail.com'],
  github: 'https://github.com/diegojgarciacallejas',
  linkedin: 'https://www.linkedin.com/in/diegojosegarciacallejas',
  pdf: { es: 'CV_Diego_Jose_Garcia_Callejas_ES.pdf', en: 'CV_Diego_Jose_Garcia_Callejas_EN.pdf' },

  es: {
    ui: { back: 'Volver al juego', pdf: 'Descargar PDF', print: 'Imprimir', made: 'Hecho a mano, píxel a píxel' },
    role: 'Estudiante de Ciencia de Datos e IA · cuarto curso en la Universidad Politécnica de Madrid',
    place: 'Madrid, España',
    sections: [
      { title: 'Resumen', text: [
        'Estudiante de cuarto curso del Grado en Ciencia de Datos e Inteligencia Artificial en la Universidad Politécnica de Madrid.',
        'Programo sobre todo en Python: análisis y procesamiento de datos y desarrollo de modelos de machine learning con Pandas, NumPy y Scikit-learn.'
      ] },
      { title: 'Proyectos', intro: 'Estos son algunos de mis proyectos:', entries: [
        { title: 'Análisis del mercado de coches mediante web scraping',
          bullets: ['Web scraping de anuncios de coches en 4 mercados europeos.', 'Limpieza de datos, análisis comparativo y visualización de precios, kilometraje y año.'],
          tags: ['Python', 'Selenium', 'Pandas', 'Matplotlib', 'Seaborn'] },
        { title: 'Clasificación de tipos de lanzamiento en la MLB',
          bullets: ['Clasificación supervisada de tipos de lanzamiento con datos de Statcast.', 'Comparación de KNN, Regresión Logística, Árbol de Decisión y SVM (precisión: 0,76).'],
          tags: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter'] },
        { title: 'Análisis de clustering sociodemográfico',
          bullets: ['Análisis no supervisado de variables sociodemográficas.', 'Comparación de clustering (KMeans, Jerárquico, DBSCAN, GMM) y selección del mejor modelo.'],
          tags: ['Python', 'Scikit-learn', 'SciPy', 'Pandas', 'Jupyter'] }
      ] },
      { title: 'Experiencia', entries: [
        { date: 'Verano 2022', title: 'Monitor de campamento de tenis', org: 'Club de Tenis y Pádel de Navalmoral de la Mata',
          bullets: ['Responsable de un grupo de unos 10 niños de 7 a 9 años, impartiendo clases de tenis en una de las cinco pistas de un campamento de verano con unos 60 participantes.',
            'Organización y supervisión de las actividades deportivas del grupo durante todo el campamento.',
            'Competencias adquiridas: comunicación, liderazgo, organización, responsabilidad y trato con niños.'] }
      ] },
      { title: 'Formación', entries: [
        { date: '2023 – Actualidad', title: 'Grado en Ciencia de Datos e Inteligencia Artificial', org: 'Universidad Politécnica de Madrid' },
        { date: '2023', title: 'Bachillerato Tecnológico', org: 'IES Augustóbriga' }
      ] },
      { title: 'Certificaciones', entries: [
        { date: '2025', title: 'GitHub Foundations Certification', org: 'GitHub' }
      ] },
      { title: 'Habilidades', groups: [
        { name: 'Técnicas', tags: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Machine Learning', 'Análisis de datos'] },
        { name: 'Personales', tags: ['Pensamiento analítico', 'Resolución de problemas', 'Trabajo en equipo', 'Comunicación', 'Adaptabilidad'] },
        { name: 'Idiomas', tags: ['Español (nativo)', 'Inglés (B2)'] }
      ] },
      { title: 'Más sobre mí', entries: [
        { date: '3 años', title: 'Residente en colegio mayor', org: 'Colegio Mayor Marqués de la Ensenada',
          bullets: ['Participé en grupos deportivos (pádel, fútbol, ping-pong) y colaboré en las actividades deportivas.',
            'Desarrollé comunicación, organización y relaciones interpersonales conviviendo con otros estudiantes.'] }
      ], text: ['Carné de conducir: B'] }
    ]
  },

  en: {
    ui: { back: 'Back to the game', pdf: 'Download PDF', print: 'Print', made: 'Handmade, pixel by pixel' },
    role: 'Data Science & AI student · 4th year at Universidad Politécnica de Madrid',
    place: 'Madrid, Spain',
    sections: [
      { title: 'Summary', text: [
        "Fourth-year student of the Bachelor's Degree in Data Science and Artificial Intelligence at Universidad Politécnica de Madrid.",
        'I mostly work in Python: data analysis and processing, and machine learning model development with Pandas, NumPy and Scikit-learn.'
      ] },
      { title: 'Projects', intro: 'These are some of my projects:', entries: [
        { title: 'Car Market Web Scraping Analysis',
          bullets: ['Web scraping of car listings across 4 European markets.', 'Data cleaning, comparative analysis and visualization of prices, mileage and year.'],
          tags: ['Python', 'Selenium', 'Pandas', 'Matplotlib', 'Seaborn'] },
        { title: 'MLB Pitch Type Classification',
          bullets: ['Supervised classification of pitch types using Statcast data.', 'Comparison of KNN, Logistic Regression, Decision Tree and SVM (accuracy: 0.76).'],
          tags: ['Python', 'Scikit-learn', 'Pandas', 'Jupyter'] },
        { title: 'Sociodemographic Clustering Analysis',
          bullets: ['Unsupervised analysis of sociodemographic variables.', 'Comparison of clustering algorithms (KMeans, Hierarchical, DBSCAN, GMM) and selection of the best model.'],
          tags: ['Python', 'Scikit-learn', 'SciPy', 'Pandas', 'Jupyter'] }
      ] },
      { title: 'Experience', entries: [
        { date: 'Summer 2022', title: 'Tennis Camp Instructor', org: 'Club de Tenis y Pádel de Navalmoral de la Mata',
          bullets: ['Responsible for a group of approximately 10 children aged 7 to 9, delivering tennis instruction on one of the five courts of a summer camp with around 60 participants.',
            "Organized and supervised the group's sports activities throughout the camp.",
            'Skills developed: communication, leadership, organization, responsibility and working with children.'] }
      ] },
      { title: 'Education', entries: [
        { date: '2023 – Present', title: "Bachelor's Degree in Data Science and AI", org: 'Universidad Politécnica de Madrid' },
        { date: '2023', title: 'Technological Baccalaureate', org: 'IES Augustóbriga' }
      ] },
      { title: 'Certifications', entries: [
        { date: '2025', title: 'GitHub Foundations Certification', org: 'GitHub' }
      ] },
      { title: 'Skills', groups: [
        { name: 'Technical', tags: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Machine Learning', 'Data Analysis'] },
        { name: 'Soft skills', tags: ['Analytical thinking', 'Problem-solving', 'Teamwork', 'Communication', 'Adaptability'] },
        { name: 'Languages', tags: ['Spanish (native)', 'English (B2)'] }
      ] },
      { title: 'More about me', entries: [
        { date: '3 years', title: 'University Hall Resident', org: 'Colegio Mayor Marqués de la Ensenada',
          bullets: ['Took part in sports groups (padel, football, table tennis) and helped with sports activities.',
            'Developed communication, organization and interpersonal skills while living with other students.'] }
      ], text: ['Driving license: Type B'] }
    ]
  }
};
