<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-link">Go to Home</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
}

.not-found-content {
  padding: 2rem;
  max-width: 600px;
  width: 100%;
}

h1 {
  font-size: 8rem;
  color: #4a90e2;
  margin: 0;
  line-height: 1;
  font-weight: bold;
}

h2 {
  font-size: 2.5rem;
  color: #333;
  margin: 1rem 0;
}

p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.home-link {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: #4a90e2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  font-size: 1.1rem;
}

.home-link:hover {
  background-color: #357abd;
}

@media (max-width: 768px) {
  h1 {
    font-size: 6rem;
  }

  h2 {
    font-size: 2rem;
  }

  p {
    font-size: 1rem;
  }

  .home-link {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .not-found-content {
    padding: 1.5rem;
  }

  h1 {
    font-size: 4rem;
  }

  h2 {
    font-size: 1.5rem;
  }
}
</style> 