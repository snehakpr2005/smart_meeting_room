import { PageHeader } from "../components/Feedback.jsx";

export default function WaitingListPage() {
  return (
    <>
      <PageHeader title="Waiting list" description="Waiting-list requests cannot be managed yet." />
      <section className="panel limitation-panel">
        <span className="limitation-icon">i</span>
        <div><h2>Backend support is missing</h2><p>The backend has no waiting-list model, routes, or assignment logic. This page intentionally does not create or display sample requests.</p></div>
      </section>
    </>
  );
}
