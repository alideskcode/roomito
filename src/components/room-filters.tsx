export function RoomFilters({
  areas,
  initialArea = "",
  initialBudget = "",
  initialAudience = "",
  initialSort = "newest",
}: {
  areas: { name: string; count: number }[];
  initialArea?: string;
  initialBudget?: string;
  initialAudience?: string;
  initialSort?: string;
}) {
  return <form className="rooms-toolbar" action="/rooms" method="get">
    <label>Area<select name="area" defaultValue={initialArea}><option value="">Any area</option>{areas.map((area) => <option value={area.name} key={area.name}>{area.name}</option>)}</select></label>
    <label>Max budget<input name="maxBudget" type="number" min="0" placeholder="Any budget" defaultValue={initialBudget} /></label>
    <label>Room for<select name="for" defaultValue={initialAudience}><option value="">Any</option><option>Boys PG</option><option>Girls PG</option><option>Family</option></select></label>
    <label>Sort by<select name="sort" defaultValue={initialSort}><option value="newest">Newest</option><option value="price">Price: low to high</option></select></label>
    <button className="button button-blue" type="submit">Apply filters</button>
  </form>;
}
