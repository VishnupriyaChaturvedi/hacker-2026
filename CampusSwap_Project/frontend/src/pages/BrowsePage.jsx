import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { EmptyState, ListingCard, SectionHead } from "../components/ListingCard";
import { CATEGORY_ICONS } from "../utils/format";

const CATEGORY_TABS = ["All", "Books", "Gadgets", "Hostel", "Cycles"];

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const category = params.get("category") || "All";
  const sort = params.get("sort") || "newest";

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => setSearchInput(q), [q]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listings({ q, category, sort })
      .then((res) => {
        if (active) setListings(res.listings);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q, category, sort]);

  function update(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === "All" || (key === "sort" && value === "newest")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setParams(next);
  }

  return (
    <section className="section">
      <SectionHead
        eyebrow="FRESH ON CAMPUS"
        title={q ? `Results for “${q}”` : "Deals students actually want."}
      >
        {CATEGORY_TABS.map((c) => (
          <button
            key={c}
            className={`filter ${category === c ? "active" : ""}`}
            onClick={() => update({ category: c })}
            type="button"
          >
            {c === "All" ? "All" : `${CATEGORY_ICONS[c] || ""} ${c}`}
          </button>
        ))}
      </SectionHead>

      <form
        className="search-row"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: searchInput });
        }}
      >
        <div className="search-box">
          ⌕
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search textbooks, calculators, cycles..."
          />
        </div>
        <button className="primary-btn" type="submit">
          Search
        </button>
        <div className="sort-wrap">
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <option value="newest">Sort: newest</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>
      </form>

      <p className="result-count">
        {loading ? "Loading…" : `${listings.length} listing${listings.length === 1 ? "" : "s"} found`}
      </p>

      <div className="listing-grid">
        {listings.length ? (
          listings.map((l) => <ListingCard key={l.id} listing={l} />)
        ) : (
          !loading && (
            <EmptyState
              title="No matching listings"
              message="Try a different search or category."
              to="/browse"
              actionLabel="Clear filters"
            />
          )
        )}
      </div>
    </section>
  );
}
