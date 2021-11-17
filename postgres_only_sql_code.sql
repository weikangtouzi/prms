CREATE FUNCTION delete_expired_and_not_applied_interview_invitation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM interview WHERE appointment_time < CURRENT_TIMESTAMP and status = null;
  RETURN NULL;
END;
$$;
CREATE TRIGGER trigger_delete_expired_and_not_applied_interview_invitation
    before INSERT ON interview
    EXECUTE PROCEDURE delete_expired_and_not_applied_interview_invitation();