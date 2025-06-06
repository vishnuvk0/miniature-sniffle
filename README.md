# Points & Miles Tracker

This is a Next.js application designed to help you track your loyalty points and miles across various programs. You can add accounts, track your balances over time, and see a history of your point accruals and redemptions.

## Features

-   **Add and Manage Accounts:** Easily add new loyalty accounts with a starting balance.
-   **Track Balance History:** Each account maintains a history of balance changes.
-   **Record Redemption Reasons:** When a balance decreases, you can record a reason for the change.
-   **Interactive Dashboard:** View all your accounts and their balances in a clean, interactive table.
-   **Detailed Account View:** Drill down into a specific account to see its balance history.
-   **Data Visualization:** (Future) Charts to visualize your points progression over time.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/)
-   **UI:** [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Database:** [PostgreSQL](https://www.postgresql.org/)

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later recommended)
-   [pnpm](https://pnpm.io/installation) (or npm/yarn)
-   [PostgreSQL](https://www.postgresql.org/download/) installed and running.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd award-tracker
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up the database:**
    -   Make sure your PostgreSQL server is running.
    -   Create a new database for this project.
    -   Create a `.env` file in the root of the project and add your database connection string:

        ```env
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
        ```
        Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE_NAME` with your actual database credentials.

4.  **Run database migrations:**
    This command will sync your database schema with the Prisma schema.
    ```bash
    npx prisma db push
    ```

5.  **Run the development server:**
    ```bash
    pnpm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
