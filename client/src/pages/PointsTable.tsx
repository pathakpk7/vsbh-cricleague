import React from 'react';

const PointsTable: React.FC = () => {
  const mockPointsTable: any[] = [];

  return (
    <div className="points-table">
      <div className="dashboard-header">
        <h1>📊 Points Table</h1>
        <p>Tournament standings and net run rates</p>
      </div>

      <div className="table-container">
        <table className="points-table-grid">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Points</th>
              <th>NRR</th>
            </tr>
          </thead>
          <tbody>
            {mockPointsTable.map((row, index) => (
              <tr key={index} className={row.position <= 2 ? 'qualified' : ''}>
                <td className="position">{row.position}</td>
                <td className="team">{row.team}</td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.lost}</td>
                <td className="points">{row.points}</td>
                <td className="nrr">{row.nrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="qualification-info">
        <div className="card">
          <h3>🏆 Qualification Status</h3>
          <div className="qualification-list">
            <div className="qualified">Top 2 teams qualify for semi-finals</div>
            <div className="qualified">Teams on position 1-2 advance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsTable;
