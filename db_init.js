try {
    db.init(true);
  } catch (err) {
    console.log("failed to init database structure with error: " + err);
}