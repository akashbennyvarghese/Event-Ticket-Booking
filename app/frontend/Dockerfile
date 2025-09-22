FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files first for dependency install
COPY package.json package-lock.json* ./

RUN npm install --silent

# Copy the rest of the app
COPY . .

ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Start React dev server
CMD ["sh", "-c", "npm start -- --host 0.0.0.0 --port 3000"]