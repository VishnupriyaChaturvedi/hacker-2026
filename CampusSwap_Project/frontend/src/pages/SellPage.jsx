import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { CATEGORIES, CONDITIONS } from "../utils/format";

const EMPTY = {
  name: "",
  category: CATEGORIES[0],
  condition: CONDITIONS[0],
  price: "",
  description: "",
};

export default function SellPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const listing = await api.createListing({
        ...form,
        price: Number(form.price),
      });
      toast("Listing published — your campus can now find it!");
      navigate(`/listing/${listing.id}`);
    } catch (err) {
      setErrors({ form: err.message });
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-page">
      <div className="form-intro">
        <span className="eyebrow">LIST AN ITEM</span>
        <h1>Turn your unused stuff into campus cash.</h1>
        <p>
          Post once and let buyers find you. You can mark an item sold or relist it anytime
          from your profile.
        </p>
        <ul className="form-tips">
          <li>Write a clear name and condition.</li>
          <li>Set a fair price — you can bargain in chat.</li>
          <li>Pick a public meet-up spot for safety.</li>
        </ul>
      </div>

      <form className="card-form" onSubmit={submit} noValidate>
        <label>
          Item name
          <input
            required
            minLength={3}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Engineering Mathematics book"
          />
        </label>
        <div className="two-col">
          <label>
            Category
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Price (₹)
            <input
              type="number"
              min="1"
              required
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="500"
            />
          </label>
        </div>
        <label>
          Condition
          <select value={form.condition} onChange={(e) => update("condition", e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Short description
          <textarea
            required
            minLength={5}
            maxLength={600}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Mention edition, accessories, usage, etc."
          />
        </label>
        {errors.form && <small className="field-error">{errors.form}</small>}
        <button className="primary-btn big" type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish listing →"}
        </button>
      </form>
    </section>
  );
}
