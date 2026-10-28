// Renders the EZ TMS "My Loads" grid rows with the app's exact row markup and status colours.
window.EZMyLoads = (() => {
  // Status colours as configured in the app (captured 28 Oct 2026)
  const STATUS = {
    AV: { bg: '#FFFF00', fg: '#000000', selectable: true },
    ASSGN: { bg: '#76FF03', fg: '#000000', selectable: true },
    DISP: { bg: '#FFA000', fg: '#FFFFFF', selectable: true },
    DLVRD: { bg: '#7B1FA2', fg: '#FFFFFF', selectable: false },
    INVAU: { bg: '#FFCCBC', fg: '#000000', selectable: false },
    INVCD: { bg: 'transparent', fg: 'inherit', selectable: false },
    OSD: { bg: '#BA68C8', fg: '#000000', selectable: false },
  };

  const td = (text = '', cls = 'small text-truncate text-tooltip') => `<td class="${cls}">${text}</td>`;
  const check = c => (c ? '<i class="fas fa-check"></i>' : '');

  function statusCell(code) {
    const s = STATUS[code];
    return `<td class="small load-status-style" style="background-color:${s.bg};color:${s.fg};"><a class="text-dotted ml-1 load-status-short">${code}</a></td>`;
  }

  function row(l) {
    const box = STATUS[l.status].selectable
      ? `<span class="ezl-checkbox ucLoadSearch_cbSelected"><input id="cb-${l.num}" type="checkbox"><label for="cb-${l.num}"></label></span>`
      : '';
    return `<tr data-load="${l.num}">
      <th class="small text-nowrap sticky-wrap-column"><span style="display: inline-block;min-width:22px">${box}</span><a class="font-weight-bold LoadSearchLoadLink">${l.num}</a> <a class="text-ezl LoadSearchExternalLoadLink"><i class="ml-1 fa-fw fas fa-external-link-alt"></i></a></th>
      ${statusCell(l.status)}
      ${td(l.customer)}${td(l.booked)}${td(l.puName)}${td(l.pickup, 'small')}
      <td class="small text-nowrap"><a class="text-dotted">${l.puDate}</a></td>${td(l.puTime, 'small')}
      ${td(l.doName)}${td(l.dropoff, 'small')}
      <td class="small text-nowrap"><a class="text-dotted">${l.doDate}</a></td>${td(l.doTime, 'small')}
      <td class="small text-center"></td>${td(l.carrier)}${td(l.eq, 'small text-center')}${td('')}${td('', 'small')}${td(l.po || '', 'small')}${td(l.bol || '', 'small')}
      ${td(l.carRate, 'small text-center')}${td(l.custRate, 'small text-center')}${td(l.profit, 'small text-center')}${td(l.pct, 'small text-center')}
      ${td(check(l.rateCon), 'small text-center')}${td(check(l.pod), 'small text-center')}${td(check(l.carInv), 'small text-center')}
      ${td(l.rep1)}${td(l.rep2 || '')}${td(l.cap || 'TL', 'small text-center')}
    </tr>`;
  }

  function render(tbody, loads) { tbody.innerHTML = loads.map(row).join(''); }

  function setStatus(tr, code) {
    tr.children[1].outerHTML = statusCell(code);
    if (!STATUS[code].selectable) tr.querySelector('th > span').innerHTML = '';
  }

  // Sample data: fictional brokerage book of business
  const SAMPLE = [
    { num: 'L-01488', status: 'AV', customer: 'Peachtree Foods', booked: '10/28/26', puName: 'Peachtree Foods DC', pickup: 'Atlanta, GA', puDate: '10/30/26', puTime: '07:00 - 11:00', doName: 'Gulf Coast Grocers', dropoff: 'Mobile, AL', doDate: '10/31/26', doTime: '08:00 - 14:00', carrier: '', eq: 'R', carRate: '$0.00', custRate: '$1,650.00', profit: '$1,650.00', pct: '100.00%', rep1: 'Alex Turner' },
    { num: 'L-01487', status: 'ASSGN', customer: 'Southern Paper Co.', booked: '10/28/26', puName: 'Southern Paper Mill', pickup: 'Chattanooga, TN', puDate: '10/29/26', puTime: '08:00 - 12:00', doName: 'Coastal Distribution', dropoff: 'Savannah, GA', doDate: '10/30/26', doTime: '07:00 - 15:00', carrier: 'BLUE RIDGE TRANSPORT', eq: 'V', carRate: '$1,925.00', custRate: '$2,450.00', profit: '$525.00', pct: '21.43%', rateCon: true, rep1: 'Alex Turner' },
    { num: 'L-01486', status: 'ASSGN', customer: 'Volunteer Steel', booked: '10/27/26', puName: 'Volunteer Steel Works', pickup: 'Knoxville, TN', puDate: '10/29/26', puTime: '06:00 - 10:00', doName: 'Midland Fabrication', dropoff: 'Birmingham, AL', doDate: '10/29/26', doTime: '13:00 - 17:00', carrier: 'SMOKY MTN CARRIERS', eq: 'F', carRate: '$1,350.00', custRate: '$1,800.00', profit: '$450.00', pct: '25.00%', rateCon: true, rep1: 'Morgan Reyes' },
    { num: 'L-01485', status: 'ASSGN', customer: 'Magnolia Home Goods', booked: '10/27/26', puName: 'Magnolia Warehouse 3', pickup: 'Memphis, TN', puDate: '10/29/26', puTime: '09:00 - 13:00', doName: 'Lone Star Retail DC', dropoff: 'Dallas, TX', doDate: '10/30/26', doTime: '08:00 - 16:00', carrier: 'DELTA LINE FREIGHT', eq: 'V', carRate: '$1,880.00', custRate: '$2,400.00', profit: '$520.00', pct: '21.67%', rateCon: true, rep1: 'Morgan Reyes' },
    { num: 'L-01484', status: 'DLVRD', customer: 'Blue Ridge Mills', booked: '10/24/26', puName: 'Blue Ridge Mills', pickup: 'Dalton, GA', puDate: '10/27/26', puTime: '07:00 - 11:00', doName: 'Carolina Flooring', dropoff: 'Charlotte, NC', doDate: '10/28/26', doTime: '08:00 - 12:00', carrier: 'PIEDMONT EXPRESS', eq: 'V', carRate: '$1,100.00', custRate: '$1,475.00', profit: '$375.00', pct: '25.42%', rateCon: true, pod: true, rep1: 'Alex Turner' },
    { num: 'L-01483', status: 'ASSGN', customer: 'Tri-State Lumber', booked: '10/24/26', puName: 'Tri-State Lumber Yard', pickup: 'Louisville, KY', puDate: '10/29/26', puTime: '07:00 - 15:00', doName: 'Hometown Builders', dropoff: 'Nashville, TN', doDate: '10/30/26', doTime: '08:00 - 12:00', carrier: 'BLUEGRASS HAULING', eq: 'F', carRate: '$900.00', custRate: '$1,250.00', profit: '$350.00', pct: '28.00%', rateCon: true, rep1: 'Morgan Reyes' },
    { num: 'L-01482', status: 'INVAU', customer: 'Coastal Packaging', booked: '10/21/26', puName: 'Coastal Packaging', pickup: 'Jacksonville, FL', puDate: '10/23/26', puTime: '06:00 - 10:00', doName: 'Peach State Foods', dropoff: 'Atlanta, GA', doDate: '10/24/26', doTime: '09:00 - 13:00', carrier: 'SUNSHINE STATE LINES', eq: 'V', carRate: '$1,050.00', custRate: '$1,400.00', profit: '$350.00', pct: '25.00%', rateCon: true, pod: true, carInv: true, rep1: 'Alex Turner' },
    { num: 'L-01481', status: 'AV', customer: 'Volunteer Steel', booked: '10/24/26', puName: 'Volunteer Steel Works', pickup: 'Knoxville, TN', puDate: '10/31/26', puTime: '06:00 - 10:00', doName: 'River City Metals', dropoff: 'Cincinnati, OH', doDate: '11/01/26', doTime: '08:00 - 12:00', carrier: '', eq: 'F', carRate: '$0.00', custRate: '$1,950.00', profit: '$1,950.00', pct: '100.00%', rep1: 'Morgan Reyes' },
    { num: 'L-01480', status: 'INVCD', customer: 'Southern Paper Co.', booked: '10/20/26', puName: 'Southern Paper Mill', pickup: 'Chattanooga, TN', puDate: '10/21/26', puTime: '08:00 - 12:00', doName: 'Coastal Distribution', dropoff: 'Savannah, GA', doDate: '10/22/26', doTime: '07:00 - 15:00', carrier: 'BLUE RIDGE TRANSPORT', eq: 'V', carRate: '$1,900.00', custRate: '$2,450.00', profit: '$550.00', pct: '22.45%', rateCon: true, pod: true, carInv: true, rep1: 'Alex Turner' },
    { num: 'L-01479', status: 'DLVRD', customer: 'Peachtree Foods', booked: '10/20/26', puName: 'Peachtree Foods DC', pickup: 'Atlanta, GA', puDate: '10/22/26', puTime: '07:00 - 11:00', doName: 'Low Country Markets', dropoff: 'Charleston, SC', doDate: '10/23/26', doTime: '08:00 - 14:00', carrier: 'PALMETTO CARRIERS', eq: 'R', carRate: '$1,200.00', custRate: '$1,600.00', profit: '$400.00', pct: '25.00%', rateCon: true, pod: true, rep1: 'Morgan Reyes' },
    { num: 'L-01478', status: 'INVCD', customer: 'Magnolia Home Goods', booked: '10/17/26', puName: 'Magnolia Warehouse 3', pickup: 'Memphis, TN', puDate: '10/20/26', puTime: '09:00 - 13:00', doName: 'Ozark Furniture Outlet', dropoff: 'Little Rock, AR', doDate: '10/20/26', doTime: '14:00 - 18:00', carrier: 'DELTA LINE FREIGHT', eq: 'V', carRate: '$650.00', custRate: '$900.00', profit: '$250.00', pct: '27.78%', rateCon: true, pod: true, carInv: true, rep1: 'Morgan Reyes' },
    { num: 'L-01477', status: 'INVCD', customer: 'Tri-State Lumber', booked: '10/16/26', puName: 'Tri-State Lumber Yard', pickup: 'Louisville, KY', puDate: '10/19/26', puTime: '07:00 - 15:00', doName: 'Buckeye Supply', dropoff: 'Columbus, OH', doDate: '10/20/26', doTime: '08:00 - 12:00', carrier: 'BLUEGRASS HAULING', eq: 'F', carRate: '$800.00', custRate: '$1,150.00', profit: '$350.00', pct: '30.43%', rateCon: true, pod: true, carInv: true, rep1: 'Alex Turner' },
    { num: 'L-01476', status: 'INVCD', customer: 'Blue Ridge Mills', booked: '10/15/26', puName: 'Blue Ridge Mills', pickup: 'Dalton, GA', puDate: '10/16/26', puTime: '07:00 - 11:00', doName: 'Gateway Flooring', dropoff: 'St. Louis, MO', doDate: '10/17/26', doTime: '08:00 - 16:00', carrier: 'HEARTLAND LOGISTICS', eq: 'V', carRate: '$1,700.00', custRate: '$2,200.00', profit: '$500.00', pct: '22.73%', rateCon: true, pod: true, carInv: true, rep1: 'Alex Turner' },
    { num: 'L-01475', status: 'INVCD', customer: 'Coastal Packaging', booked: '10/14/26', puName: 'Coastal Packaging', pickup: 'Jacksonville, FL', puDate: '10/15/26', puTime: '06:00 - 10:00', doName: 'Gulf Coast Grocers', dropoff: 'Mobile, AL', doDate: '10/16/26', doTime: '08:00 - 14:00', carrier: 'SUNSHINE STATE LINES', eq: 'V', carRate: '$950.00', custRate: '$1,300.00', profit: '$350.00', pct: '26.92%', rateCon: true, pod: true, carInv: true, rep1: 'Morgan Reyes' },
  ];

  return { STATUS, render, setStatus, SAMPLE };
})();
