FROM node

WORKDIR /appsplit

COPY ./expense-splitter-backend/package.json ./expense-splitter-backend/package-lock.json ./expense-splitter-backend/

WORKDIR /appsplit/expense-splitter-backend

RUN npm install

WORKDIR /appsplit

COPY ./frontend ./frontend

COPY ./expense-splitter-backend/app.js ./expense-splitter-backend/


WORKDIR /appsplit/expense-splitter-backend

CMD ["node", "app.js"]
