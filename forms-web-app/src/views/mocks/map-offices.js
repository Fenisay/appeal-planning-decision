const mapOffices = (offices) =>
  offices.map((office) => ({
    value: office.name,
    text: office['official-name'],
  }));

export default mapOffices;
