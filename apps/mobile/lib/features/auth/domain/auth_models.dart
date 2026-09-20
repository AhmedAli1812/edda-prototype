class UserSummary {
  final String id;
  final String phone;
  final String fullName;
  final String role; // 'CUSTOMER' or 'TECHNICIAN'
  final String status;
  final int rewardPoints;

  const UserSummary({
    required this.id,
    required this.phone,
    required this.fullName,
    required this.role,
    required this.status,
    this.rewardPoints = 0,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: json['id'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      role: json['role'] as String? ?? 'CUSTOMER',
      status: json['status'] as String? ?? 'ACTIVE',
      rewardPoints: (json['rewardPoints'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'fullName': fullName,
        'role': role,
        'status': status,
        'rewardPoints': rewardPoints,
      };
}

class AuthSession {
  final String accessToken;
  final String refreshToken;
  final UserSummary user;

  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      user: UserSummary.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }
}
