-- Add SOLO_SPECIALIST to request_type CHECK constraint
ALTER TABLE access_requests
DROP CONSTRAINT IF EXISTS access_requests_request_type_check;

ALTER TABLE access_requests
ADD CONSTRAINT access_requests_request_type_check
CHECK (request_type IN ('SPECIALIST', 'COMPANY', 'SOLO_SPECIALIST'));

-- Add comment
COMMENT ON COLUMN access_requests.request_type IS 'Type of access request: SPECIALIST (joining company), COMPANY (company registration), or SOLO_SPECIALIST (independent specialist)';
